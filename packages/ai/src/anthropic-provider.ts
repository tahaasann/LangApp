import Anthropic from "@anthropic-ai/sdk";
import type { AiProvider } from "./provider.ts";

/** AI model kimliğinin tek kaynağı. */
export const AI_MODEL = "claude-haiku-5-5";

const MAX_TOKENS = 16_000;

export function createAnthropicProvider(apiKey: string): AiProvider {
  // Adres açıkça verilir: ortamdaki ANTHROPIC_BASE_URL, anahtarı başka bir sunucuya göndermesin.
  const client = new Anthropic({ apiKey, baseURL: "https://api.anthropic.com" });
  return {
    async complete({ system, user, schema }) {
      const response = await client.messages.create({
        model: AI_MODEL,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{ role: "user", content: user }],
        // Thinking açık kalır: kapalıyken doğrulama geçişi 24/100'e düşüyor (L-002).
        thinking: { type: "adaptive" },
        output_config: { effort: "low", format: { type: "json_schema", schema } },
      });
      // İlk blok thinking olabilir; içerik türe göre okunur.
      const text = response.content
        .flatMap((block) => (block.type === "text" ? [block.text] : []))
        .join("");
      return { text, stopReason: response.stop_reason };
    },
  };
}
