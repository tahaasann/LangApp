/**
 * Yerel AI sunucusu: emülatör 10.0.2.2 üzerinden bu makinedeki 127.0.0.1'e ulaşır.
 * API anahtarı burada kalır, uygulama paketine girmez. Üretimde aynı `handleAiRequest`
 * Supabase Edge Function içinde çalışacak.
 */
import { createServer } from "node:http";
import { createAnthropicProvider } from "./anthropic-provider.ts";
import { handleAiRequest } from "./router.ts";

const PORT = Number(process.env.AI_DEV_PORT ?? 8787);
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY yok. Çalıştırma: node --env-file=<.env yolu> packages/ai/src/dev-server.ts");
  process.exit(1);
}
const provider = createAnthropicProvider(apiKey);

createServer(async (incoming, outgoing) => {
  const started = performance.now();
  const chunks: Buffer[] = [];
  for await (const chunk of incoming) chunks.push(chunk as Buffer);
  const hasBody = incoming.method !== "GET" && incoming.method !== "HEAD";
  const response = await handleAiRequest(
    provider,
    new Request(`http://localhost${incoming.url ?? "/"}`, {
      method: incoming.method ?? "GET",
      ...(hasBody ? { body: Buffer.concat(chunks) } : {}),
    }),
  );
  outgoing.writeHead(response.status, { "content-type": "application/json" });
  outgoing.end(await response.text());
  console.log(
    `${incoming.method} ${incoming.url} ${response.status} ${Math.round(performance.now() - started)}ms`,
  );
}).listen(PORT, "127.0.0.1", () => {
  console.log(`AI sunucusu hazır: http://127.0.0.1:${PORT}`);
});
