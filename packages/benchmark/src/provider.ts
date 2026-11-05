import Anthropic from "@anthropic-ai/sdk";

export type JsonSchema = Record<string, unknown>;

export type CompletionRequest = {
  system: string;
  user: string;
  schema: JsonSchema;
};

export type CompletionResult = {
  text: string;
  stopReason: string | null;
  inputTokens: number;
  cachedInputTokens: number;
  /** Thinking token'ları dahildir. */
  outputTokens: number;
  thinkingBlocks: number;
};

export type Provider = {
  model: string;
  /** USD / 1M token */
  price: { input: number; cachedInput: number; output: number };
  complete(request: CompletionRequest): Promise<CompletionResult>;
};

const MAX_TOKENS = 16_000;

export type ThinkingMode = "adaptive" | "disabled";

export function createAnthropicProvider(
  thinking: ThinkingMode,
  model = "claude-haiku-5-5",
): Provider {
  // Adres açıkça verilir: ortamdaki ANTHROPIC_BASE_URL, anahtarı başka bir sunucuya göndermesin.
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseURL: "https://api.anthropic.com",
  });
  return {
    model,
    price: { input: 0.1, cachedInput: 0.01, output: 0.5 },
    async complete({ system, user, schema }) {
      const response = await client.messages.create({
        model,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{ role: "user", content: user }],
        thinking: { type: thinking },
        output_config: {
          effort: "low",
          format: { type: "json_schema", schema },
        },
      });

      // İlk blok thinking olabilir; içerik türe göre okunur.
      const text = response.content
        .flatMap((block) => (block.type === "text" ? [block.text] : []))
        .join("");

      return {
        text,
        stopReason: response.stop_reason,
        inputTokens: response.usage.input_tokens,
        cachedInputTokens: response.usage.cache_read_input_tokens ?? 0,
        outputTokens: response.usage.output_tokens,
        thinkingBlocks: response.content.filter((block) => block.type === "thinking").length,
      };
    },
  };
}
