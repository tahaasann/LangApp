import { z } from "zod";
import { AlignmentPairSchema } from "./alignment-pair.ts";
import { LanguageCodeSchema } from "./language-code.ts";

/** Kaynak metin sınırı: AI maliyetinin üst sınırını belirler (UNIT_ECONOMICS.md §5). */
export const MAX_SOURCE_TEXT_LENGTH = 1500;
/** Çeviri dile göre daha uzun olabilir. */
export const MAX_TARGET_TEXT_LENGTH = 3000;
export const MAX_TOPIC_LENGTH = 200;

export const LearnerLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);
export type LearnerLevel = z.infer<typeof LearnerLevelSchema>;

export const GenerateLengthSchema = z.enum(["word", "phrase", "sentence", "paragraph"]);
export type GenerateLength = z.infer<typeof GenerateLengthSchema>;

const nonBlank = (max: number) =>
  z
    .string()
    .max(max)
    .refine((text) => text.trim() !== "", { error: "Metin boş olamaz" });

const differentLanguages = (request: { learningLanguage: string; nativeLanguage: string }) =>
  request.learningLanguage !== request.nativeLanguage;
const differentLanguagesError = {
  error: "Öğrenilen dil ve ana dil farklı olmalı",
  path: ["nativeLanguage"],
};

const languagePair = {
  learningLanguage: LanguageCodeSchema,
  nativeLanguage: LanguageCodeSchema,
  level: LearnerLevelSchema,
};

export const AlignRequestSchema = z
  .strictObject({
    ...languagePair,
    sourceText: nonBlank(MAX_SOURCE_TEXT_LENGTH),
    targetText: nonBlank(MAX_TARGET_TEXT_LENGTH),
  })
  .refine(differentLanguages, differentLanguagesError);
export type AlignRequest = z.infer<typeof AlignRequestSchema>;

export const AlignResponseSchema = z.strictObject({ pairs: z.array(AlignmentPairSchema) });
export type AlignResponse = z.infer<typeof AlignResponseSchema>;

export const TranslateRequestSchema = z
  .strictObject({ ...languagePair, sourceText: nonBlank(MAX_SOURCE_TEXT_LENGTH) })
  .refine(differentLanguages, differentLanguagesError);
export type TranslateRequest = z.infer<typeof TranslateRequestSchema>;

export const TranslateResponseSchema = z.strictObject({ targetText: z.string().min(1) });
export type TranslateResponse = z.infer<typeof TranslateResponseSchema>;

export const GenerateRequestSchema = z
  .strictObject({
    ...languagePair,
    topic: nonBlank(MAX_TOPIC_LENGTH),
    length: GenerateLengthSchema,
  })
  .refine(differentLanguages, differentLanguagesError);
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export const GenerateResponseSchema = z.strictObject({
  sourceText: z.string().min(1),
  targetText: z.string().min(1),
});
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;

export const AiErrorCodeSchema = z.enum([
  "INVALID_REQUEST",
  "MODEL_REFUSED",
  "ALIGNMENT_FAILED",
  "UPSTREAM_ERROR",
]);
export type AiErrorCode = z.infer<typeof AiErrorCodeSchema>;

export const AiErrorResponseSchema = z.strictObject({ code: AiErrorCodeSchema });
export type AiErrorResponse = z.infer<typeof AiErrorResponseSchema>;
