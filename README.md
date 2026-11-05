# LinguaLink Lite

LinguaLink, öğrenilen dildeki bir metni ana dildeki çevirisiyle renkli ifade çiftleri hâlinde eşleştiren bir mobil dil öğrenme uygulamasıdır. Kullanıcı metni yazar veya AI ile üretir, eşleşen ifadelere dokunarak görür ve dinler, kaydettiği dersleri gruplar, paylaşır ve quiz yapar.

- **Durum:** Geliştirme aşamasında; yol haritası [ATOMIC-TODO.md](ATOMIC-TODO.md)
- **Mimari:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Prototipi çalıştırma (Windows + Android emülatör)

Gereksinimler: Node 24, pnpm 11, Android Studio ve çalışan bir emülatör. Repo `C:\dev\lang` gibi kısa ve ASCII bir yolda olmalıdır. Kök dizinde `ANTHROPIC_API_KEY` içeren bir `.env` dosyası gerekir.

```bash
pnpm install
```

Üç ayrı terminalde:

```bash
pnpm ai:dev
```

```bash
pnpm mobile
```

```bash
pnpm android
```

Son komut uygulamayı derleyip emülatöre kurar; yalnızca native bağımlılık değişince yeniden gerekir. Windows yol sınırı nedeniyle native derleme, reponun yanında bir `.ll` klasörü oluşturur (`apps/mobile/react-native.config.js`). AI sunucusu kapalıyken elle eşleştirme, kayıt ve quiz çalışmaya devam eder.

Prototip sınırları: AI çağrıları Supabase Edge Function yerine yerel `packages/ai` sunucusundan geçer, kota ve Free/Pro ayrımı uygulanmaz, arayüz yalnızca Türkçedir. `lingualink://` bağlantıları bazı mesajlaşma uygulamalarında tıklanamaz; bu durumda bağlantı Dersler sekmesindeki "Bağlantıyla ders al" ekranına yapıştırılır.

## Testler

```bash
pnpm typecheck
```

```bash
pnpm test
```
