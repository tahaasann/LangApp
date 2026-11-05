import { TestQuestionSchema } from "@lingualink/contracts";
import type { Lesson } from "@lingualink/contracts";
import { buildQuiz, QuizPoolTooSmallError } from "./build-quiz";

const lessonWith = (
  id: string,
  phrases: [string, string][],
  languages: Pick<Lesson, "learningLanguage" | "nativeLanguage"> = {
    learningLanguage: "en",
    nativeLanguage: "tr",
  },
): Lesson => ({
  id,
  title: id,
  ...languages,
  sourceText: phrases.map(([source]) => source).join(" "),
  targetText: phrases.map(([, target]) => target).join(" "),
  groupId: null,
  createdAt: "2026-11-05T10:00:00.000Z",
  updatedAt: "2026-11-05T10:00:00.000Z",
  pairs: phrases.map(([source, target], order) => ({
    order,
    source: { pairOrder: order, start: 0, end: source.length, text: source, color: "#E74C3C" },
    target: { pairOrder: order, start: 0, end: target.length, text: target, color: "#E74C3C" },
  })),
});

const FOUR: [string, string][] = [
  ["apple", "elma"],
  ["house", "ev"],
  ["water", "su"],
  ["book", "kitap"],
];
const fixedRandom = () => 0.42;

describe("buildQuiz", () => {
  it("şemaya uyan ve doğru şıkkı işaretli sorular üretir", () => {
    const quiz = buildQuiz([lessonWith("a", FOUR)], { count: 4, random: fixedRandom });
    expect(quiz).toHaveLength(4);
    for (const { question } of quiz) {
      expect(TestQuestionSchema.safeParse(question).success).toBe(true);
      const answer = FOUR.find(([source]) => source === question.prompt)?.[1];
      expect(question.choices[question.correctIndex]).toBe(answer);
    }
  });

  it("istenen soru sayısını aşmaz", () => {
    expect(buildQuiz([lessonWith("a", FOUR)], { count: 2, random: fixedRandom })).toHaveLength(2);
  });

  it("noktalamadan ibaret parçaları soru yapmaz ve kenar noktalamasını temizler", () => {
    const quiz = buildQuiz(
      [lessonWith("a", [...FOUR, [".", "."], ["Hello!", "Merhaba!"]])],
      { count: 10, random: fixedRandom },
    );
    expect(quiz).toHaveLength(5);
    expect(quiz.map(({ question }) => question.prompt)).toContain("Hello");
    expect(quiz.flatMap(({ question }) => question.choices)).not.toContain(".");
  });

  it("şıklarda büyük küçük harf farkıyla aynı ifadeyi tekrar etmez", () => {
    const quiz = buildQuiz([lessonWith("a", [...FOUR, ["Apple", "Elma"], ["sun", "güneş"]])], {
      count: 6,
      random: fixedRandom,
    });
    for (const { question } of quiz) {
      expect(new Set(question.choices.map((choice) => choice.toLowerCase())).size).toBe(4);
    }
  });

  it("farklı dil çiftlerini karıştırmaz", () => {
    const spanish = lessonWith(
      "b",
      [
        ["agua", "water"],
        ["casa", "house"],
        ["libro", "book"],
        ["sol", "sun"],
      ],
      { learningLanguage: "es", nativeLanguage: "en" },
    );
    const quiz = buildQuiz([lessonWith("a", FOUR), spanish], { count: 8, random: fixedRandom });
    const turkishChoices = new Set(FOUR.map(([, target]) => target));
    for (const { question, learningLanguage } of quiz) {
      const inTurkish = question.choices.filter((choice) => turkishChoices.has(choice)).length;
      expect(inTurkish).toBe(learningLanguage === "en" ? 4 : 0);
    }
  });

  it("birden çok dersin ifadelerini birleştirir", () => {
    const quiz = buildQuiz(
      [lessonWith("a", FOUR.slice(0, 2)), lessonWith("b", FOUR.slice(2))],
      { count: 4, random: fixedRandom },
    );
    expect(quiz).toHaveLength(4);
  });

  it("uzunluğa göre soru türü seçer", () => {
    const sentence = "this is a much longer example";
    const paragraph = Array.from({ length: 30 }, () => "word").join(" ");
    const quiz = buildQuiz(
      [lessonWith("a", [...FOUR, [sentence, "uzun örnek"], [paragraph, "paragraf"]])],
      { count: 6, random: fixedRandom },
    );
    const typeOf = (prompt: string) => quiz.find(({ question }) => question.prompt === prompt)?.question.type;
    expect(typeOf("apple")).toBe("word");
    expect(typeOf(sentence)).toBe("sentence");
    expect(typeOf(paragraph)).toBe("paragraph");
  });

  it("dört farklı karşılık yoksa hata verir", () => {
    expect(() => buildQuiz([lessonWith("a", FOUR.slice(0, 3))], { count: 3, random: fixedRandom })).toThrow(
      QuizPoolTooSmallError,
    );
    expect(() => buildQuiz([], { count: 3, random: fixedRandom })).toThrow(QuizPoolTooSmallError);
  });

  it("doğru şıkkın konumunu karıştırır", () => {
    const values = [0.1, 0.9, 0.5, 0.2, 0.7, 0.3, 0.8, 0.6];
    let index = 0;
    const random = () => values[index++ % values.length] as number;
    const quiz = buildQuiz([lessonWith("a", [...FOUR, ["sun", "güneş"], ["moon", "ay"]])], { count: 6, random });
    expect(new Set(quiz.map(({ question }) => question.correctIndex)).size).toBeGreaterThan(1);
  });
});
