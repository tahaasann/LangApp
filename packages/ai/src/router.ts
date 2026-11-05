import {
  AlignRequestSchema,
  GenerateRequestSchema,
  TranslateRequestSchema,
} from "@lingualink/contracts";
import type { AiErrorCode } from "@lingualink/contracts";
import { AiFailure, alignText, generateLesson, translateText } from "./operations.ts";
import type { AiProvider } from "./provider.ts";

const STATUS: Record<AiErrorCode, number> = {
  INVALID_REQUEST: 400,
  MODEL_REFUSED: 422,
  ALIGNMENT_FAILED: 422,
  UPSTREAM_ERROR: 502,
};

type Route = (provider: AiProvider, body: unknown) => Promise<unknown>;

const parsed =
  <Input,>(
    schema: { parse(value: unknown): Input },
    run: (provider: AiProvider, input: Input) => Promise<unknown>,
  ): Route =>
  (provider, body) => {
    let input: Input;
    try {
      input = schema.parse(body);
    } catch {
      throw new AiFailure("INVALID_REQUEST");
    }
    return run(provider, input);
  };

const ROUTES: Record<string, Route> = {
  "/align-text": parsed(AlignRequestSchema, alignText),
  "/translate-text": parsed(TranslateRequestSchema, translateText),
  "/generate-lesson": parsed(GenerateRequestSchema, generateLesson),
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

/** Web standardı `Request`/`Response` kullanır; aynı kod Edge Function'da da çalışır. */
export async function handleAiRequest(provider: AiProvider, request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  if (pathname === "/health") return json(200, { status: "ok" });

  const route = ROUTES[pathname];
  if (!route) return json(404, { code: "INVALID_REQUEST" });
  if (request.method !== "POST") return json(405, { code: "INVALID_REQUEST" });

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AiFailure("INVALID_REQUEST");
    }
    return json(200, await route(provider, body));
  } catch (error) {
    const code: AiErrorCode = error instanceof AiFailure ? error.code : "UPSTREAM_ERROR";
    return json(STATUS[code], { code });
  }
}
