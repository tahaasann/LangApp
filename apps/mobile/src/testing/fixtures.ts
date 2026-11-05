import type { Lesson } from "@lingualink/contracts";
import { mapPairsToSpans } from "../features/alignment/domain/map-pairs-to-spans";

export function lessonFixture(overrides: Partial<Lesson> = {}): Lesson {
  const sourceText = "Good morning";
  const targetText = "Gün aydın";
  return {
    id: "lesson-1",
    title: "Sabah",
    learningLanguage: "en",
    nativeLanguage: "tr",
    sourceText,
    targetText,
    groupId: null,
    createdAt: "2026-11-05T09:00:00.000Z",
    updatedAt: "2026-11-05T09:00:00.000Z",
    pairs: mapPairsToSpans({
      sourceText,
      targetText,
      pairs: [
        { order: 0, source: "Good", target: "Gün" },
        { order: 1, source: "morning", target: "aydın" },
      ],
    }),
    ...overrides,
  };
}

export function quizLessonFixture(): Lesson {
  const words: [string, string][] = [
    ["apple", "elma"],
    ["house", "ev"],
    ["water", "su"],
    ["book", "kitap"],
  ];
  const sourceText = words.map(([source]) => source).join(" ");
  const targetText = words.map(([, target]) => target).join(" ");
  return lessonFixture({
    id: "quiz-lesson",
    title: "Kelimeler",
    sourceText,
    targetText,
    pairs: mapPairsToSpans({
      sourceText,
      targetText,
      pairs: words.map(([source, target], order) => ({ order, source, target })),
    }),
  });
}
