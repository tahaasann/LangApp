import { z } from "zod";
import { LanguageCodeSchema } from "./language-code.ts";

export const TextSpanSchema = z
  .strictObject({
    pairOrder: z.number().int().nonnegative(),
    /** UTF-16 indeksi, dahil. */
    start: z.number().int().nonnegative(),
    /** UTF-16 indeksi, hariç. */
    end: z.number().int().positive(),
    text: z.string().min(1),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  })
  .refine((span) => span.end > span.start, {
    error: "end, start değerinden büyük olmalı",
    path: ["end"],
  });
export type TextSpan = z.infer<typeof TextSpanSchema>;

export const MappedPairSchema = z.strictObject({
  order: z.number().int().nonnegative(),
  source: TextSpanSchema,
  target: TextSpanSchema,
});
export type MappedPair = z.infer<typeof MappedPairSchema>;

export const LessonSchema = z
  .strictObject({
    id: z.string().min(1),
    title: z.string().trim().min(1),
    learningLanguage: LanguageCodeSchema,
    nativeLanguage: LanguageCodeSchema,
    sourceText: z.string().min(1),
    targetText: z.string().min(1),
    pairs: z.array(MappedPairSchema),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .refine((lesson) => lesson.learningLanguage !== lesson.nativeLanguage, {
    error: "Öğrenilen dil ve ana dil farklı olmalı",
    path: ["nativeLanguage"],
  });
export type Lesson = z.infer<typeof LessonSchema>;
