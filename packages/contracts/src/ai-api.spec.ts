import { describe, expect, it } from "vitest";
import {
  AlignRequestSchema,
  GenerateRequestSchema,
  MAX_SOURCE_TEXT_LENGTH,
  MAX_TARGET_TEXT_LENGTH,
  TranslateRequestSchema,
} from "./ai-api.ts";

const align = {
  learningLanguage: "en",
  nativeLanguage: "tr",
  level: "beginner",
  sourceText: "Hello",
  targetText: "Merhaba",
};

describe("AlignRequestSchema", () => {
  it("geçerli isteği kabul eder", () => {
    expect(AlignRequestSchema.safeParse(align).success).toBe(true);
  });

  it("aynı dil çiftini reddeder", () => {
    expect(AlignRequestSchema.safeParse({ ...align, nativeLanguage: "en" }).success).toBe(false);
  });

  it("yalnızca boşluk olan metni reddeder", () => {
    expect(AlignRequestSchema.safeParse({ ...align, sourceText: "   " }).success).toBe(false);
  });

  it("uzunluk sınırlarını uygular", () => {
    const atLimit = { ...align, sourceText: "a".repeat(MAX_SOURCE_TEXT_LENGTH) };
    expect(AlignRequestSchema.safeParse(atLimit).success).toBe(true);
    expect(AlignRequestSchema.safeParse({ ...atLimit, sourceText: `${atLimit.sourceText}a` }).success).toBe(false);
    expect(
      AlignRequestSchema.safeParse({ ...align, targetText: "a".repeat(MAX_TARGET_TEXT_LENGTH + 1) }).success,
    ).toBe(false);
  });
});

describe("TranslateRequestSchema", () => {
  it("metni zorunlu kılar", () => {
    const { targetText: _targetText, ...request } = align;
    expect(TranslateRequestSchema.safeParse(request).success).toBe(true);
    expect(TranslateRequestSchema.safeParse({ ...request, sourceText: "" }).success).toBe(false);
  });
});

describe("GenerateRequestSchema", () => {
  const request = {
    learningLanguage: "en",
    nativeLanguage: "tr",
    level: "intermediate",
    topic: "kahve siparişi",
    length: "sentence",
  };

  it("geçerli isteği kabul eder", () => {
    expect(GenerateRequestSchema.safeParse(request).success).toBe(true);
  });

  it("boş konuyu ve bilinmeyen uzunluğu reddeder", () => {
    expect(GenerateRequestSchema.safeParse({ ...request, topic: " " }).success).toBe(false);
    expect(GenerateRequestSchema.safeParse({ ...request, length: "essay" }).success).toBe(false);
  });
});
