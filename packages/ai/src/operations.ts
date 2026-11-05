import {
  AlignResponseSchema,
  MAX_SOURCE_TEXT_LENGTH,
  MAX_TARGET_TEXT_LENGTH,
  validateAlignment,
} from "@lingualink/contracts";
import type {
  AiErrorCode,
  AlignRequest,
  AlignResponse,
  AlignmentPair,
  GenerateRequest,
  GenerateResponse,
  LanguageCode,
  LearnerLevel,
  TranslateRequest,
  TranslateResponse,
} from "@lingualink/contracts";
import { buildGrammarHints } from "./grammar-hints.ts";
import {
  ALIGN_SYSTEM_PROMPT,
  GENERATE_SYSTEM_PROMPT,
  TRANSLATE_SYSTEM_PROMPT,
} from "./prompts.ts";
import type { AiProvider, CompletionRequest, JsonSchema } from "./provider.ts";

export class AiFailure extends Error {
  readonly code: AiErrorCode;

  constructor(code: AiErrorCode) {
    super(code);
    this.code = code;
  }
}

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: "English",
  tr: "Türkçe",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
  pt: "Português",
  ja: "日本語",
  ko: "한국어",
  ar: "العربية",
  zh: "中文",
  ru: "Русский",
};

const GRANULARITY: Record<LearnerLevel, "fine" | "medium" | "coarse"> = {
  beginner: "fine",
  intermediate: "medium",
  advanced: "coarse",
};

const stringsSchema = (...names: string[]): JsonSchema => ({
  type: "object",
  properties: Object.fromEntries(names.map((name) => [name, { type: "string" }])),
  required: names,
  additionalProperties: false,
});

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

const language = (code: LanguageCode) => ({ code, name: LANGUAGE_NAMES[code] });

/** Sağlayıcı hatasını ve reddi tek yerde çevirir; `max_tokens` kesik yanıttır, çağıran karar verir. */
async function complete(provider: AiProvider, request: CompletionRequest) {
  let result;
  try {
    result = await provider.complete(request);
  } catch {
    throw new AiFailure("UPSTREAM_ERROR");
  }
  if (result.stopReason === "refusal") throw new AiFailure("MODEL_REFUSED");
  return result;
}

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

type AttemptResult = { pairs: AlignmentPair[] } | { errors: string[] };

async function alignAttempt(
  provider: AiProvider,
  request: AlignRequest,
  previousErrors?: string[],
): Promise<AttemptResult> {
  const { text, stopReason } = await complete(provider, {
    system: ALIGN_SYSTEM_PROMPT,
    schema: ALIGN_SCHEMA,
    user: JSON.stringify({
      learning_language: language(request.learningLanguage),
      native_language: language(request.nativeLanguage),
      learner_level: request.level,
      granularity: GRANULARITY[request.level],
      grammar_hints: buildGrammarHints(request.learningLanguage, request.nativeLanguage, request.level),
      source_text: request.sourceText,
      target_text: request.targetText,
      ...(previousErrors ? { previous_errors: previousErrors } : {}),
    }),
  });
  if (stopReason === "max_tokens") return { errors: ["TRUNCATED"] };

  const parsed = AlignResponseSchema.safeParse(parseJson(text));
  if (!parsed.success) return { errors: ["SCHEMA_INVALID"] };

  const validation = validateAlignment(
    { sourceText: request.sourceText, targetText: request.targetText, pairs: parsed.data.pairs },
    { allowWhitespaceGaps: true },
  );
  return validation.valid
    ? { pairs: parsed.data.pairs }
    : { errors: [...new Set(validation.errors.map((error) => error.code))] };
}

const splitSentences = (text: string, locale: string) =>
  [...new Intl.Segmenter(locale, { granularity: "sentence" }).segment(text)]
    .map((part) => part.segment.trim())
    .filter(Boolean);

/** Akış: docs/ALIGN_VALIDATION.md §1 */
export async function alignText(provider: AiProvider, request: AlignRequest): Promise<AlignResponse> {
  const first = await alignAttempt(provider, request);
  if ("pairs" in first) return first;
  const second = await alignAttempt(provider, request, first.errors);
  if ("pairs" in second) return second;

  const sources = splitSentences(request.sourceText, request.learningLanguage);
  const targets = splitSentences(request.targetText, request.nativeLanguage);
  if (sources.length < 2 || sources.length !== targets.length) {
    throw new AiFailure("ALIGNMENT_FAILED");
  }

  const pairs: AlignmentPair[] = [];
  for (const [index, sourceText] of sources.entries()) {
    const chunk = await alignAttempt(provider, {
      ...request,
      sourceText,
      targetText: targets[index] ?? "",
    });
    if (!("pairs" in chunk)) throw new AiFailure("ALIGNMENT_FAILED");
    for (const pair of chunk.pairs) pairs.push({ ...pair, order: pairs.length });
  }
  return { pairs };
}

export async function translateText(
  provider: AiProvider,
  request: TranslateRequest,
): Promise<TranslateResponse> {
  const { text, stopReason } = await complete(provider, {
    system: TRANSLATE_SYSTEM_PROMPT,
    schema: stringsSchema("target_text"),
    user: JSON.stringify({
      learning_language: language(request.learningLanguage),
      native_language: language(request.nativeLanguage),
      learner_level: request.level,
      source_text: request.sourceText,
    }),
  });
  const output = parseJson(text) as { target_text?: unknown } | null;
  const targetText = output?.target_text;
  if (
    stopReason === "max_tokens" ||
    typeof targetText !== "string" ||
    targetText.trim() === "" ||
    targetText.length > MAX_TARGET_TEXT_LENGTH
  ) {
    throw new AiFailure("UPSTREAM_ERROR");
  }
  return { targetText: targetText.trim() };
}

export async function generateLesson(
  provider: AiProvider,
  request: GenerateRequest,
): Promise<GenerateResponse> {
  const { text, stopReason } = await complete(provider, {
    system: GENERATE_SYSTEM_PROMPT,
    schema: stringsSchema("source_text", "target_text"),
    user: JSON.stringify({
      learning_language: language(request.learningLanguage),
      native_language: language(request.nativeLanguage),
      learner_level: request.level,
      difficulty: request.level,
      topic: request.topic,
      length: request.length,
      grammar_hints: buildGrammarHints(request.learningLanguage, request.nativeLanguage, request.level),
    }),
  });
  const output = parseJson(text) as { source_text?: unknown; target_text?: unknown } | null;
  const sourceText = output?.source_text;
  const targetText = output?.target_text;
  if (
    stopReason === "max_tokens" ||
    typeof sourceText !== "string" ||
    typeof targetText !== "string" ||
    sourceText.trim() === "" ||
    targetText.trim() === "" ||
    sourceText.length > MAX_SOURCE_TEXT_LENGTH ||
    targetText.length > MAX_TARGET_TEXT_LENGTH
  ) {
    throw new AiFailure("UPSTREAM_ERROR");
  }
  return { sourceText: sourceText.trim(), targetText: targetText.trim() };
}
