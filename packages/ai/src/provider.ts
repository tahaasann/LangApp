export type JsonSchema = Record<string, unknown>;

export type CompletionRequest = {
  system: string;
  user: string;
  schema: JsonSchema;
};

export type CompletionResult = {
  text: string;
  stopReason: string | null;
};

/** Sağlayıcı değişimi yalnızca bu arayüzün adaptörünü değiştirir. */
export type AiProvider = {
  complete(request: CompletionRequest): Promise<CompletionResult>;
};
