import { LANGUAGE_CODES } from "@lingualink/contracts";
import type { LanguageCode, LearnerLevel } from "@lingualink/contracts";

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
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

export const LANGUAGE_OPTIONS = LANGUAGE_CODES.map((value) => ({ value, label: LANGUAGE_NAMES[value] }));

export const LEVEL_OPTIONS: readonly { value: LearnerLevel; label: string }[] = [
  { value: "beginner", label: "Başlangıç" },
  { value: "intermediate", label: "Orta" },
  { value: "advanced", label: "İleri" },
];
