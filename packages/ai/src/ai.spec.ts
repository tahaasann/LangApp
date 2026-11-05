import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { AlignRequest } from "@lingualink/contracts";
import { alignText, AiFailure, generateLesson, translateText } from "./operations.ts";
import { buildGrammarHints } from "./grammar-hints.ts";
import {
  ALIGN_SYSTEM_PROMPT,
  GENERATE_SYSTEM_PROMPT,
  TRANSLATE_SYSTEM_PROMPT,
} from "./prompts.ts";
import { handleAiRequest } from "./router.ts";
import type { AiProvider, CompletionRequest, CompletionResult } from "./provider.ts";

const provider = (...outputs: (Partial<CompletionResult> | Error)[]) => {
  const calls: CompletionRequest[] = [];
  const complete = vi.fn(async (request: CompletionRequest) => {
    calls.push(request);
    const next = outputs.shift();
    if (!next) throw new Error("Beklenmeyen çağrı");
    if (next instanceof Error) throw next;
    return { text: "", stopReason: "end_turn", ...next };
  });
  return { provider: { complete } satisfies AiProvider, calls, complete };
};
const reply = (pairs: [string, string][]) => ({
  text: JSON.stringify({
    pairs: pairs.map(([source, target], order) => ({ order, source, target })),
  }),
});

const request: AlignRequest = {
  learningLanguage: "en",
  nativeLanguage: "tr",
  level: "beginner",
  sourceText: "Good morning.",
  targetText: "Günaydın.",
};
const valid = reply([["Good morning.", "Günaydın."]]);
const missing = reply([["Good", "Günaydın"]]);

const docBody = (name: string) => {
  const raw = readFileSync(resolve(import.meta.dirname, "../../../docs", name), "utf8");
  const [, ...rest] = raw.split(/\r?\n---\r?\n/);
  return rest.join("\n---\n").replace(/\r\n/g, "\n").trim();
};

describe("promptlar", () => {
  it("dokümanlardaki metinle aynıdır", () => {
    expect(ALIGN_SYSTEM_PROMPT).toBe(docBody("SYSTEM_PROMPT.md"));
    expect(GENERATE_SYSTEM_PROMPT).toBe(docBody("GENERATE_SYSTEM_PROMPT.md"));
    expect(TRANSLATE_SYSTEM_PROMPT).toBe(docBody("TRANSLATE_SYSTEM_PROMPT.md"));
  });
});

describe("buildGrammarHints", () => {
  it("dil çifti notunu iki yönde de bulur", () => {
    expect(buildGrammarHints("en", "tr")).toContain("Pro-drop");
    expect(buildGrammarHints("tr", "en")).toContain("Pro-drop");
  });

  it("bilinmeyen çiftte seviyeyi içeren genel notu verir", () => {
    const hints = buildGrammarHints("ko", "pt", "advanced");
    expect(hints).toContain("advanced");
    expect(hints).not.toContain("{{");
  });
});

describe("alignText", () => {
  it("geçerli yanıtı tek çağrıda döndürür ve metni kullanıcı mesajında yollar", async () => {
    const fake = provider(valid);
    const result = await alignText(fake.provider, request);
    expect(result.pairs).toEqual([{ order: 0, source: "Good morning.", target: "Günaydın." }]);
    expect(fake.calls).toHaveLength(1);
    expect(fake.calls[0]?.system).toBe(ALIGN_SYSTEM_PROMPT);
    const user = JSON.parse(fake.calls[0]?.user ?? "{}");
    expect(user.source_text).toBe("Good morning.");
    expect(user.granularity).toBe("fine");
    expect(user.previous_errors).toBeUndefined();
  });

  it("parça arasında boşluk atlanmasını kabul eder", async () => {
    const fake = provider(reply([["Good", "Gün"], ["morning.", "aydın."]]));
    const result = await alignText(fake.provider, request);
    expect(result.pairs).toHaveLength(2);
  });

  it("doğrulama hatasında hata kodlarıyla bir kez yeniden dener", async () => {
    const fake = provider(missing, valid);
    await alignText(fake.provider, request);
    expect(fake.calls).toHaveLength(2);
    expect(JSON.parse(fake.calls[1]?.user ?? "{}").previous_errors).toContain("SOURCE_COVERAGE");
  });

  it("bozuk JSON'u hata sayıp yeniden dener", async () => {
    const fake = provider({ text: "{bozuk" }, valid);
    await expect(alignText(fake.provider, request)).resolves.toBeDefined();
  });

  it("max_tokens durumunu hata sayıp yeniden dener", async () => {
    const fake = provider({ ...valid, stopReason: "max_tokens" }, valid);
    await alignText(fake.provider, request);
    expect(fake.calls).toHaveLength(2);
  });

  it("reddi yeniden denemeden bildirir", async () => {
    const fake = provider({ stopReason: "refusal" });
    await expect(alignText(fake.provider, request)).rejects.toMatchObject({ code: "MODEL_REFUSED" });
    expect(fake.calls).toHaveLength(1);
  });

  it("tek cümlede iki başarısız denemeden sonra hata verir", async () => {
    const fake = provider(missing, missing);
    await expect(alignText(fake.provider, request)).rejects.toMatchObject({ code: "ALIGNMENT_FAILED" });
    expect(fake.calls).toHaveLength(2);
  });

  const twoSentences: AlignRequest = {
    ...request,
    sourceText: "Good morning. Thank you.",
    targetText: "Günaydın. Teşekkürler.",
  };

  it("uzun metinde başarısız olursa cümle cümle dener ve sırayı birleştirir", async () => {
    const fake = provider(
      missing,
      missing,
      reply([["Good morning.", "Günaydın."]]),
      reply([["Thank you.", "Teşekkürler."]]),
    );
    const result = await alignText(fake.provider, twoSentences);
    expect(result.pairs).toEqual([
      { order: 0, source: "Good morning.", target: "Günaydın." },
      { order: 1, source: "Thank you.", target: "Teşekkürler." },
    ]);
    expect(JSON.parse(fake.calls[3]?.user ?? "{}").source_text).toBe("Thank you.");
  });

  it("cümle sayıları eşit değilse parçalamadan hata verir", async () => {
    const fake = provider(missing, missing);
    await expect(
      alignText(fake.provider, { ...twoSentences, targetText: "Günaydın, teşekkürler." }),
    ).rejects.toBeInstanceOf(AiFailure);
    expect(fake.calls).toHaveLength(2);
  });

  it("parçalı denemede bir cümle başarısızsa hata verir", async () => {
    const fake = provider(missing, missing, reply([["Good morning.", "Günaydın."]]), missing);
    await expect(alignText(fake.provider, twoSentences)).rejects.toMatchObject({
      code: "ALIGNMENT_FAILED",
    });
  });

  it("sağlayıcı hatasını UPSTREAM_ERROR yapar", async () => {
    const fake = provider(new Error("ağ"));
    await expect(alignText(fake.provider, request)).rejects.toMatchObject({ code: "UPSTREAM_ERROR" });
  });
});

describe("translateText", () => {
  const translate = { ...request, targetText: undefined };
  const { targetText: _targetText, ...body } = translate;

  it("çeviriyi döndürür", async () => {
    const fake = provider({ text: JSON.stringify({ target_text: "Günaydın." }) });
    await expect(translateText(fake.provider, body)).resolves.toEqual({ targetText: "Günaydın." });
    expect(fake.calls[0]?.system).toBe(TRANSLATE_SYSTEM_PROMPT);
  });

  it("boş çeviriyi hata sayar", async () => {
    const fake = provider({ text: JSON.stringify({ target_text: " " }) });
    await expect(translateText(fake.provider, body)).rejects.toMatchObject({ code: "UPSTREAM_ERROR" });
  });
});

describe("generateLesson", () => {
  const body = {
    learningLanguage: "en",
    nativeLanguage: "tr",
    level: "beginner",
    topic: "kahve",
    length: "sentence",
  } as const;

  it("metni ve çeviriyi döndürür", async () => {
    const fake = provider({ text: JSON.stringify({ source_text: "A coffee.", target_text: "Bir kahve." }) });
    await expect(generateLesson(fake.provider, body)).resolves.toEqual({
      sourceText: "A coffee.",
      targetText: "Bir kahve.",
    });
    const user = JSON.parse(fake.calls[0]?.user ?? "{}");
    expect(user.topic).toBe("kahve");
    expect(user.length).toBe("sentence");
    expect(user.difficulty).toBe("beginner");
  });

  it("sınırı aşan metni reddeder", async () => {
    const fake = provider({
      text: JSON.stringify({ source_text: "a".repeat(1501), target_text: "b" }),
    });
    await expect(generateLesson(fake.provider, body)).rejects.toMatchObject({ code: "UPSTREAM_ERROR" });
  });

  it("reddi bildirir", async () => {
    const fake = provider({ stopReason: "refusal" });
    await expect(generateLesson(fake.provider, body)).rejects.toMatchObject({ code: "MODEL_REFUSED" });
  });
});

describe("handleAiRequest", () => {
  const post = (path: string, body: unknown) =>
    new Request(`http://local${path}`, {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    });

  it("eşleştirme isteğini yanıtlar", async () => {
    const response = await handleAiRequest(provider(valid).provider, post("/align-text", request));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      pairs: [{ order: 0, source: "Good morning.", target: "Günaydın." }],
    });
  });

  it("sağlık kontrolünü yanıtlar", async () => {
    const response = await handleAiRequest(provider().provider, new Request("http://local/health"));
    expect(response.status).toBe(200);
  });

  it("bilinmeyen yolu 404 yapar", async () => {
    const response = await handleAiRequest(provider().provider, post("/nope", {}));
    expect(response.status).toBe(404);
  });

  it("POST dışını reddeder", async () => {
    const response = await handleAiRequest(provider().provider, new Request("http://local/align-text"));
    expect(response.status).toBe(405);
  });

  it("bozuk JSON ve geçersiz gövdeyi çağrı yapmadan 400 yapar", async () => {
    const fake = provider();
    for (const body of ["{bozuk", { ...request, sourceText: "" }]) {
      const response = await handleAiRequest(fake.provider, post("/align-text", body));
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ code: "INVALID_REQUEST" });
    }
    expect(fake.complete).not.toHaveBeenCalled();
  });

  it.each([
    [{ stopReason: "refusal" }, 422, "MODEL_REFUSED"],
    [new Error("ağ"), 502, "UPSTREAM_ERROR"],
  ] as const)("%# hatayı durum koduna çevirir", async (output, status, code) => {
    const response = await handleAiRequest(provider(output).provider, post("/align-text", request));
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ code });
  });

  it("doğrulanamayan eşleştirmeyi 422 yapar", async () => {
    const response = await handleAiRequest(provider(missing, missing).provider, post("/align-text", request));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ code: "ALIGNMENT_FAILED" });
  });
});
