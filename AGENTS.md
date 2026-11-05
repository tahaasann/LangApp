# LinguaLink — Ajan Kuralları

Önce [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ve [ATOMIC-TODO.md](ATOMIC-TODO.md) dosyalarını oku.

## Komutlar

- `pnpm typecheck` — tüm paketlerin tip kontrolü
- `pnpm test` — tüm paketlerin testleri
- `pnpm --filter @lingualink/contracts test` — tek paket

## Kurallar

- Tek adım = tek commit (Conventional Commits). Doğrulanmamış adım commit edilmez.
- Test adımlarında önce kırmızı test, sonra implementasyon.
- Paylaşılan tipler `packages/contracts` içinde Zod şeması olarak tanımlanır; elle kopyalanmaz.
- `domain` katmanı framework veya SDK içe aktarmaz. Bkz. `.cursor/rules/hexagonal.mdc`.
- `source` öğrenilen dil, `target` ana dildir. Kodda "hedef dil" terimi kullanılmaz.
- AI model kimliği tek sabitte tutulur. API anahtarı yalnızca Edge Functions'tadır.
- `docs/UNIT_ECONOMICS.md` onaylanmadan RevenueCat fiyatı yapılandırılmaz.
