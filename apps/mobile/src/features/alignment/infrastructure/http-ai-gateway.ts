import {
  AiErrorResponseSchema,
  AlignResponseSchema,
  GenerateResponseSchema,
  TranslateResponseSchema,
} from "@lingualink/contracts";
import { AiGatewayError } from "../domain/ai-gateway";
import type { IAiGateway } from "../domain/ai-gateway";

/** Doğrulama sonrası yeniden deneme ve parçalı istekler bir dakikayı aşabilir. */
const DEFAULT_TIMEOUT_MS = 120_000;

type Parser<Output> = { safeParse(value: unknown): { success: true; data: Output } | { success: false } };

export class HttpAiGateway implements IAiGateway {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  private readonly timeoutMs: number;

  constructor(baseUrl: string, fetcher: typeof fetch = fetch, timeoutMs = DEFAULT_TIMEOUT_MS) {
    this.baseUrl = baseUrl;
    this.fetcher = fetcher;
    this.timeoutMs = timeoutMs;
  }

  align: IAiGateway["align"] = (request) => this.post("/align-text", request, AlignResponseSchema);
  translate: IAiGateway["translate"] = (request) => this.post("/translate-text", request, TranslateResponseSchema);
  generate: IAiGateway["generate"] = (request) => this.post("/generate-lesson", request, GenerateResponseSchema);

  private async post<Output>(path: string, body: unknown, schema: Parser<Output>): Promise<Output> {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeoutMs);
    try {
      const response = await this.fetcher(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const failure = AiErrorResponseSchema.safeParse(payload);
        throw new AiGatewayError(failure.success ? failure.data.code : "UPSTREAM_ERROR");
      }
      const parsed = schema.safeParse(payload);
      if (!parsed.success) throw new AiGatewayError("UPSTREAM_ERROR");
      return parsed.data;
    } catch (error) {
      if (error instanceof AiGatewayError) throw error;
      throw new AiGatewayError(timedOut ? "TIMEOUT" : "NETWORK");
    } finally {
      clearTimeout(timer);
    }
  }
}
