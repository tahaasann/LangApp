/**
 * L-002 ölçümü. Çalıştırma:
 *   node --env-file=<.env yolu> packages/benchmark/src/run.ts [çalıştırma sayısı] [adaptive|disabled]
 * Sonuç: docs/benchmarks/<tarih>-<model>-<thinking>.json
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AlignmentPairListSchema, validateAlignment } from "@lingualink/contracts";
import type { AlignmentPair } from "@lingualink/contracts";
import { ALIGN_CASES, GENERATE_CASES } from "./cases.ts";
import type { AlignCase, GenerateCase } from "./cases.ts";
import { createAnthropicProvider } from "./provider.ts";
import type { CompletionResult, JsonSchema, Provider, ThinkingMode } from "./provider.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const readDoc = (name: string) => readFileSync(resolve(root, "docs", name), "utf8");

/** Dokümanın ilk `---` ayracından sonrası promptun kendisidir. */
const promptBody = (name: string) => {
  const [, ...rest] = readDoc(name).split(/\r?\n---\r?\n/);
  return rest.join("\n---\n").trim();
};

const ALIGN_SYSTEM = promptBody("SYSTEM_PROMPT.md");
const GENERATE_SYSTEM = promptBody("GENERATE_SYSTEM_PROMPT.md");
const HINTS_DOC = readDoc("LANGUAGE_PAIR_HINTS.md");

function grammarHints(a: string, b: string): string {
  for (const heading of [`${a} ↔ ${b}`, `${b} ↔ ${a}`]) {
    const start = HINTS_DOC.indexOf(`### ${heading}`);
    const block = start === -1 ? null : /```text\r?\n([\s\S]*?)\r?\n```/.exec(HINTS_DOC.slice(start));
    if (block?.[1]) return block[1];
  }
  const fallback = /Genel yedek[\s\S]*?```text\r?\n([\s\S]*?)\r?\n```/.exec(HINTS_DOC);
  return fallback?.[1] ?? "";
}

const ALIGN_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    pairs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          order: { type: "integer" },
          source: { type: "string" },
          target: { type: "string" },
        },
        required: ["order", "source", "target"],
        additionalProperties: false,
      },
    },
  },
  required: ["pairs"],
  additionalProperties: false,
};

const GENERATE_SCHEMA: JsonSchema = {
  type: "object",
  properties: { source_text: { type: "string" }, target_text: { type: "string" } },
  required: ["source_text", "target_text"],
  additionalProperties: false,
};

function splitSentences(text: string, locale: string): string[] {
  const segmenter = new Intl.Segmenter(locale, { granularity: "sentence" });
  return [...segmenter.segment(text)].map((part) => part.segment.trim()).filter(Boolean);
}

type CallRecord = {
  ms: number;
  usage: Omit<CompletionResult, "text"> | null;
  error?: string;
};

function cost(provider: Provider, usage: CallRecord["usage"]): number {
  if (!usage) return 0;
  const uncached = usage.inputTokens;
  return (
    (uncached * provider.price.input +
      usage.cachedInputTokens * provider.price.cachedInput +
      usage.outputTokens * provider.price.output) /
    1_000_000
  );
}

async function timedCall(provider: Provider, request: Parameters<Provider["complete"]>[0]) {
  const started = performance.now();
  try {
    const result = await provider.complete(request);
    const { text, ...usage } = result;
    return { text, record: { ms: performance.now() - started, usage } as CallRecord };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { text: "", record: { ms: performance.now() - started, usage: null, error: message } as CallRecord };
  }
}

async function alignChunk(
  provider: Provider,
  testCase: AlignCase,
  sourceText: string,
  targetText: string,
) {
  const user = JSON.stringify({
    learning_language: testCase.learning,
    native_language: testCase.native,
    learner_level: testCase.level,
    granularity: testCase.granularity,
    grammar_hints: grammarHints(testCase.learning.code, testCase.native.code),
    source_text: sourceText,
    target_text: targetText,
  });
  const { text, record } = await timedCall(provider, {
    system: ALIGN_SYSTEM,
    user,
    schema: ALIGN_SCHEMA,
  });

  let pairs: AlignmentPair[] = [];
  let schemaValid = false;
  try {
    pairs = AlignmentPairListSchema.parse(JSON.parse(text)).pairs;
    schemaValid = true;
  } catch {
    schemaValid = false;
  }
  const strict = validateAlignment({ sourceText, targetText, pairs });
  const lenient = validateAlignment({ sourceText, targetText, pairs }, { allowWhitespaceGaps: true });
  return {
    sourceText,
    targetText,
    record,
    schemaValid,
    strictValid: schemaValid && strict.valid,
    lenientValid: schemaValid && lenient.valid,
    errors: strict.errors,
    pairs,
  };
}

async function runAlign(provider: Provider, testCase: AlignCase) {
  const sources = splitSentences(testCase.sourceText, testCase.learning.code);
  const targets = splitSentences(testCase.targetText, testCase.native.code);
  const canChunk = testCase.chunked && sources.length === targets.length;
  const chunks = canChunk
    ? sources.map((source, index) => [source, targets[index] ?? ""] as const)
    : ([[testCase.sourceText, testCase.targetText]] as const);

  const started = performance.now();
  const results = [];
  for (const [source, target] of chunks) {
    results.push(await alignChunk(provider, testCase, source, target));
  }
  return {
    chunkCount: chunks.length,
    sentenceCounts: [sources.length, targets.length],
    ms: performance.now() - started,
    strictValid: results.every((result) => result.strictValid),
    lenientValid: results.every((result) => result.lenientValid),
    costUsd: results.reduce((sum, result) => sum + cost(provider, result.record.usage), 0),
    chunks: results,
  };
}

async function runGenerate(provider: Provider, testCase: GenerateCase) {
  const user = JSON.stringify({
    learning_language: testCase.learning,
    native_language: testCase.native,
    learner_level: testCase.level,
    difficulty: testCase.level,
    topic: testCase.topic,
    grammar_hints: grammarHints(testCase.learning.code, testCase.native.code),
  });
  const { text, record } = await timedCall(provider, {
    system: GENERATE_SYSTEM,
    user,
    schema: GENERATE_SCHEMA,
  });
  return { text, record, costUsd: cost(provider, record.usage) };
}

const percentile = (values: number[], ratio: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)] ?? 0;
};

const runs = Number(process.argv[2] ?? 5);
const thinking: ThinkingMode = process.argv[3] === "disabled" ? "disabled" : "adaptive";
const provider = createAnthropicProvider(thinking);
const output: Record<string, unknown> = {
  model: provider.model,
  thinking,
  date: new Date().toISOString(),
  runs,
  align: {},
  generate: {},
};
const summary: string[] = [];

for (const testCase of ALIGN_CASES) {
  const attempts = [];
  for (let run = 0; run < runs; run += 1) attempts.push(await runAlign(provider, testCase));
  (output.align as Record<string, unknown>)[testCase.id] = attempts;
  const strict = attempts.filter((attempt) => attempt.strictValid).length;
  const lenient = attempts.filter((attempt) => attempt.lenientValid).length;
  const costs = attempts.reduce((sum, attempt) => sum + attempt.costUsd, 0) / attempts.length;
  const chunkMs = attempts.flatMap((attempt) => attempt.chunks.map((chunk) => chunk.record.ms));
  const failures = attempts.flatMap((attempt) => attempt.chunks).filter((chunk) => chunk.record.error);
  summary.push(
    `${testCase.id}: strict ${strict}/${runs}, lenient ${lenient}/${runs}, ` +
      `istek=${attempts[0]?.chunkCount}, ort $${costs.toFixed(6)}, ` +
      `P95 ${Math.round(percentile(chunkMs, 0.95))}ms, hata=${failures.length}`,
  );
  console.log(summary.at(-1));
}

for (const testCase of GENERATE_CASES) {
  const attempts = [];
  for (let run = 0; run < runs; run += 1) attempts.push(await runGenerate(provider, testCase));
  (output.generate as Record<string, unknown>)[testCase.id] = attempts;
  const costs = attempts.reduce((sum, attempt) => sum + attempt.costUsd, 0) / attempts.length;
  const failures = attempts.filter((attempt) => attempt.record.error).length;
  summary.push(`${testCase.id}: ort $${costs.toFixed(6)}, hata=${failures}`);
  console.log(summary.at(-1));
}

const directory = resolve(root, "docs/benchmarks");
mkdirSync(directory, { recursive: true });
const file = resolve(directory, `${new Date().toISOString().slice(0, 10)}-${provider.model}-${thinking}.json`);
writeFileSync(file, `${JSON.stringify({ ...output, summary }, null, 2)}\n`);
console.log(`Sonuç: ${file}`);
