import { AiGatewayError } from "../domain/ai-gateway";
import { HttpAiGateway } from "./http-ai-gateway";

const request = {
  learningLanguage: "en",
  nativeLanguage: "tr",
  level: "beginner",
  sourceText: "Hello",
  targetText: "Merhaba",
} as const;
const response = (status: number, body: unknown) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status });

const gateway = (fetcher: typeof fetch, timeoutMs = 1000) =>
  new HttpAiGateway("http://host:1", fetcher, timeoutMs);

describe("HttpAiGateway", () => {
  it("doğru adrese JSON gönderir ve yanıtı döndürür", async () => {
    const pairs = [{ order: 0, source: "Hello", target: "Merhaba" }];
    const fetcher = jest.fn(async () => response(200, { pairs }));
    await expect(gateway(fetcher as never).align(request)).resolves.toEqual({ pairs });
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://host:1/align-text");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(request);
  });

  it("çeviri ve üretim adreslerini kullanır", async () => {
    const fetcher = jest.fn(async (url: string) =>
      url.endsWith("/translate-text")
        ? response(200, { targetText: "Merhaba" })
        : response(200, { sourceText: "Hi", targetText: "Selam" }),
    );
    const client = gateway(fetcher as never);
    await expect(
      client.translate({ learningLanguage: "en", nativeLanguage: "tr", level: "beginner", sourceText: "Hello" }),
    ).resolves.toEqual({ targetText: "Merhaba" });
    await expect(
      client.generate({
        learningLanguage: "en",
        nativeLanguage: "tr",
        level: "beginner",
        topic: "selam",
        length: "word",
      }),
    ).resolves.toEqual({ sourceText: "Hi", targetText: "Selam" });
  });

  it("sunucu hata kodunu taşır", async () => {
    const client = gateway((async () => response(422, { code: "ALIGNMENT_FAILED" })) as never);
    await expect(client.align(request)).rejects.toMatchObject({ code: "ALIGNMENT_FAILED" });
    await expect(client.align(request)).rejects.toBeInstanceOf(AiGatewayError);
  });

  it("tanımsız hata gövdesini UPSTREAM_ERROR yapar", async () => {
    const client = gateway((async () => response(500, "<html>")) as never);
    await expect(client.align(request)).rejects.toMatchObject({ code: "UPSTREAM_ERROR" });
  });

  it("şemaya uymayan başarılı yanıtı reddeder", async () => {
    const client = gateway((async () => response(200, { pairs: "yok" })) as never);
    await expect(client.align(request)).rejects.toMatchObject({ code: "UPSTREAM_ERROR" });
  });

  it("ağ hatasını NETWORK yapar", async () => {
    const client = gateway((async () => {
      throw new TypeError("Network request failed");
    }) as never);
    await expect(client.align(request)).rejects.toMatchObject({ code: "NETWORK" });
  });

  it("süre aşımında isteği iptal eder", async () => {
    const fetcher = ((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      })) as never;
    await expect(gateway(fetcher, 5).align(request)).rejects.toMatchObject({ code: "TIMEOUT" });
  });
});
