import { describe, expect, it } from "vitest";
import {
  AlignmentPairListSchema,
  AlignmentPairSchema,
  EntitlementTierSchema,
  HIGHLIGHT_PALETTE,
  LanguageCodeSchema,
  LANGUAGE_CODES,
  LessonSchema,
  TestQuestionSchema,
  TextSpanSchema,
} from "./index.ts";

const span = {
  pairOrder: 0,
  start: 0,
  end: 5,
  text: "Today",
  color: "#E74C3C",
};

const lesson = {
  id: "lesson-1",
  title: "Mutlu gün",
  learningLanguage: "en",
  nativeLanguage: "tr",
  sourceText: "Today",
  targetText: "Bugün",
  pairs: [{ order: 0, source: span, target: { ...span, text: "Bugün" } }],
  createdAt: "2026-11-05T10:00:00.000Z",
  updatedAt: "2026-11-05T10:00:00.000Z",
};

const question = {
  type: "word",
  prompt: "Today",
  choices: ["Bugün", "Yarın", "Dün", "Şimdi"],
  correctIndex: 0,
};

describe("LanguageCodeSchema", () => {
  it("12 dili kabul eder", () => {
    expect(LANGUAGE_CODES).toHaveLength(12);
    for (const code of LANGUAGE_CODES) {
      expect(LanguageCodeSchema.safeParse(code).success).toBe(true);
    }
  });

  it("listede olmayan kodu reddeder", () => {
    expect(LanguageCodeSchema.safeParse("xx").success).toBe(false);
  });
});

describe("AlignmentPairSchema", () => {
  it("geçerli çifti kabul eder", () => {
    const pair = { order: 0, source: "Today", target: "Bugün" };
    expect(AlignmentPairSchema.parse(pair)).toEqual(pair);
  });

  it("boş hedefi reddeder", () => {
    expect(AlignmentPairSchema.safeParse({ order: 0, source: "I", target: "" }).success).toBe(false);
  });

  it("AI'ın renk döndürmesini reddeder", () => {
    const pair = { order: 0, source: "Today", target: "Bugün", color: "#E74C3C" };
    expect(AlignmentPairSchema.safeParse(pair).success).toBe(false);
  });
});

describe("AlignmentPairListSchema", () => {
  it("fazladan anahtarı reddeder", () => {
    expect(AlignmentPairListSchema.safeParse({ pairs: [], note: "x" }).success).toBe(false);
  });
});

describe("HIGHLIGHT_PALETTE", () => {
  it("24 benzersiz ve span şemasına uygun renk içerir", () => {
    expect(new Set(HIGHLIGHT_PALETTE).size).toBe(24);
    for (const color of HIGHLIGHT_PALETTE) {
      expect(TextSpanSchema.safeParse({ ...span, color }).success).toBe(true);
    }
  });
});

describe("TextSpanSchema", () => {
  it("end <= start durumunu reddeder", () => {
    expect(TextSpanSchema.safeParse({ ...span, start: 5, end: 5 }).success).toBe(false);
  });
});

describe("LessonSchema", () => {
  it("geçerli dersi kabul eder", () => {
    expect(LessonSchema.safeParse(lesson).success).toBe(true);
  });

  it("boş başlığı reddeder", () => {
    expect(LessonSchema.safeParse({ ...lesson, title: "   " }).success).toBe(false);
  });

  it("aynı öğrenilen ve ana dili reddeder", () => {
    expect(LessonSchema.safeParse({ ...lesson, nativeLanguage: "en" }).success).toBe(false);
  });
});

describe("TestQuestionSchema", () => {
  it("geçerli soruyu kabul eder", () => {
    expect(TestQuestionSchema.safeParse(question).success).toBe(true);
  });

  it("tekrarlı şıkkı reddeder", () => {
    const choices = ["Bugün", "Bugün", "Dün", "Şimdi"];
    expect(TestQuestionSchema.safeParse({ ...question, choices }).success).toBe(false);
  });

  it("aralık dışı doğru cevabı reddeder", () => {
    expect(TestQuestionSchema.safeParse({ ...question, correctIndex: 4 }).success).toBe(false);
  });
});

describe("EntitlementTierSchema", () => {
  it("bilinmeyen katmanı reddeder", () => {
    expect(EntitlementTierSchema.safeParse("premium").success).toBe(false);
  });
});
