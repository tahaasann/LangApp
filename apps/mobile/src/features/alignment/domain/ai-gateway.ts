import type {
  AiErrorCode,
  AlignRequest,
  AlignResponse,
  GenerateRequest,
  GenerateResponse,
  TranslateRequest,
  TranslateResponse,
} from "@lingualink/contracts";

export type AiGatewayErrorCode = AiErrorCode | "NETWORK" | "TIMEOUT";

export class AiGatewayError extends Error {
  readonly code: AiGatewayErrorCode;

  constructor(code: AiGatewayErrorCode) {
    super(code);
    this.code = code;
  }
}

export interface IAiGateway {
  align(request: AlignRequest): Promise<AlignResponse>;
  translate(request: TranslateRequest): Promise<TranslateResponse>;
  generate(request: GenerateRequest): Promise<GenerateResponse>;
}
