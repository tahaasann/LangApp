import type { LanguageCode } from "@lingualink/contracts";

export interface ISpeechService {
  /** Çalan sesi keser ve metni verilen dilde okur. */
  speak(text: string, language: LanguageCode): void;
  stop(): void;
}
