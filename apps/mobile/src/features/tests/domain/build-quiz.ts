import type { LanguageCode, Lesson, TestQuestion, TestQuestionType } from "@lingualink/contracts";

export type QuizQuestion = { question: TestQuestion; learningLanguage: LanguageCode };
export type QuizOptions = { count: number; random: () => number };

export class QuizPoolTooSmallError extends Error {}

const CHOICE_COUNT = 4;
const EDGE_PUNCTUATION = /^[\s\p{P}\p{S}]+|[\s\p{P}\p{S}]+$/gu;

const clean = (text: string) => text.replace(EDGE_PUNCTUATION, "");
const key = (text: string) => text.toLocaleLowerCase();

function shuffled<Item>(items: readonly Item[], random: () => number): Item[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other] as Item, result[index] as Item];
  }
  return result;
}

function typeOf(prompt: string): TestQuestionType {
  const words = prompt.split(/\s+/).length;
  if (words <= 3) return "word";
  return words <= 25 ? "sentence" : "paragraph";
}

type Entry = { source: string; target: string; learning: LanguageCode; poolKey: string };

/** Yanlış şıklar aynı dil çiftindeki diğer karşılıklardan seçilir. */
export function buildQuiz(lessons: readonly Lesson[], { count, random }: QuizOptions): QuizQuestion[] {
  const seen = new Set<string>();
  const entries: Entry[] = [];
  const pools = new Map<string, Map<string, string>>();

  for (const lesson of lessons) {
    const poolKey = `${lesson.learningLanguage}|${lesson.nativeLanguage}`;
    const pool = pools.get(poolKey) ?? new Map<string, string>();
    pools.set(poolKey, pool);
    for (const pair of lesson.pairs) {
      const source = clean(pair.source.text);
      const target = clean(pair.target.text);
      if (!source || !target) continue;
      if (!pool.has(key(target))) pool.set(key(target), target);
      const identity = `${poolKey}|${key(source)}|${key(target)}`;
      if (seen.has(identity)) continue;
      seen.add(identity);
      entries.push({ source, target, learning: lesson.learningLanguage, poolKey });
    }
  }

  const usable = entries.filter((entry) => (pools.get(entry.poolKey)?.size ?? 0) >= CHOICE_COUNT);
  if (usable.length === 0) throw new QuizPoolTooSmallError("En az dört farklı karşılık gerekli");

  return shuffled(usable, random)
    .slice(0, count)
    .map((entry) => {
      const pool = pools.get(entry.poolKey) as Map<string, string>;
      const wrong = shuffled(
        [...pool.entries()].filter(([poolEntry]) => poolEntry !== key(entry.target)).map(([, text]) => text),
        random,
      ).slice(0, CHOICE_COUNT - 1);
      const choices = shuffled([entry.target, ...wrong], random);
      return {
        learningLanguage: entry.learning,
        question: {
          type: typeOf(entry.source),
          prompt: entry.source,
          choices,
          correctIndex: choices.indexOf(entry.target),
        },
      };
    });
}
