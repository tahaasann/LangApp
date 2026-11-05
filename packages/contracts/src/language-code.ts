import { z } from "zod";

export const LANGUAGE_CODES = [
  "en",
  "tr",
  "es",
  "de",
  "fr",
  "it",
  "pt",
  "ja",
  "ko",
  "ar",
  "zh",
  "ru",
] as const;

export const LanguageCodeSchema = z.enum(LANGUAGE_CODES);
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;
