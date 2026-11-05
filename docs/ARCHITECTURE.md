# LinguaLink — Mimari

> **Son güncelleme:** 2026-11-05

## 1. Sözlük

| Terim | Anlamı |
|-------|--------|
| `source_text`, `source` | **Öğrenilen** dildeki metin (üst kutu, TTS bu dilde) |
| `target_text`, `target` | **Ana** dildeki çeviri (alt kutu) |
| `learningLanguage` | Kullanıcının öğrendiği dil; `source` bu dildedir |
| `nativeLanguage` | Kullanıcının ana dili; `target` bu dildedir |

`source` ve `target` eşleştirme yönünü, `learning` ve `native` kullanıcıya göre dili anlatır. "Hedef dil" ifadesi `target` ile karıştığı için kodda kullanılmaz.

## 2. Repo yapısı

```text
apps/mobile/          Expo uygulaması
packages/contracts/   Paylaşılan Zod şemaları (mobil + Edge Functions)
packages/prompts/     Sistem promptları ve kullanıcı mesajı üreticileri
supabase/             Migration'lar ve Edge Functions
docs/                 Mimari, prompt ve ekonomi kararları
```

## 3. Hexagonal katmanlar

Her özellik aynı klasör şablonunu izler:

```text
apps/mobile/src/features/<context>/
  domain/           Varlıklar, value object'ler, port arayüzleri, politikalar
  application/      Use case'ler
  infrastructure/   Port adaptörleri (SQLite, Supabase, AI, ...)
  presentation/     Ekranlar, bileşenler, hook'lar
```

Bağımlılık yönü: `presentation → application → domain ← infrastructure`.

- `domain` hiçbir framework'ü, SDK'yı veya başka katmanı içe aktarmaz; yalnızca `@lingualink/contracts`.
- `application` portlara bağımlıdır, adaptörlere değil.
- Adaptörler composition root'ta bağlanır. Port başına küçük arayüz tercih edilir (`ILessonReader`, `ILessonWriter`).
- `app/` rotaları ince tutulur; ekranı `presentation`'dan render eder.

## 4. Bounded context'ler

`lessons` · `languages` · `alignment` · `flashcards` · `tests` · `sharing` · `billing` · `auth` · `usage` · `onboarding` · `growth` · `marketplace`

Bir context başka bir context'in `domain`'i dışında iç katmanına erişmez.

## 5. AI pipeline

```text
generate-lesson (Pro) → source_text + target_text
                                  │
kullanıcının yapıştırdığı metin ──┤
                                  ▼
             splitIntoSentences → align-text → AlignmentValidator
                                                     │
                     geçersiz: 1 yeniden deneme, sonra manuel mod
                                                     ▼
                              MapPairsToSpans → HighlightText + TTS
```

- **Model:** `claude-haiku-5-5`. Model kimliği tek bir sabitte tutulur; çağrılar `IAlignmentService` portunun arkasındadır, sağlayıcı değişimi use case'lere dokunmaz.
- **Neden Haiku 5.5:** Kullanıcı kararı. L-002 ölçümü (`UNIT_ECONOMICS.md` §4) yeterli kaliteyi gösterdi; `gpt-6-luna` ile karşılaştırma yapılmadı.
- **Çağrı ayarları:** `output_config.effort: "low"`, structured output, thinking açık, `temperature` yok. Thinking maliyetin ve gecikmenin çoğunu oluşturur ama kapatıldığında çıktı kalitesi kabul edilemez düzeye iniyor. Yanıt blokları `type` alanına göre okunur.
- **Sistem promptu sabittir:** Dil, seviye ve metin yalnızca kullanıcı mesajında gider. Böylece önbellek gerekirse kod değişmeden açılır ve kullanıcı metni talimat olarak yorumlanmaz.
- **Doğrulama:** Kurallar `ALIGN_VALIDATION.md`, konum ve renk `SPAN_MAPPING.md` içindedir. AI renk veya konum döndürmez.

## 6. Depolama ve kimlik

| Katman | Dersler | Kimlik |
|--------|---------|--------|
| Free | SQLite (cihazda) | Supabase anonim oturum |
| Pro / Lifetime | Supabase (RLS) | Hesaba yükseltilmiş oturum |

- Anonim oturum, kayıtsız kullanıcının AI kotasını sunucuda saymak için gereklidir (`user_id`). Ders içeriği buna rağmen cihazda kalır.
- `StorageRouter`, tier'a göre adaptör seçer; Pro'ya geçişte `MigrateLocalToCloudUseCase` bir kez çalışır.

## 7. Güvenlik ve uyum

- `ANTHROPIC_API_KEY` ve service role anahtarı yalnızca Edge Functions'tadır; `EXPO_PUBLIC_` önekiyle hiçbir gizli değer tanımlanmaz.
- Kota sunucuda, AI çağrısından önce kontrol edilir; istemci limiti yalnızca UX içindir.
- Kullanıcı metni AI'a ilk kez gönderilmeden önce uygulama içinde sağlayıcı açıkça belirtilerek onay alınır; gizlilik politikası aynı bilgiyi içerir (L-261).

## 8. Expo SDK 58 notları

- Geliştirme **dev build** ile yapılır (`npx expo run:android`); Expo Go'ya güvenilmez.
- `react-native/Libraries/*` derin içe aktarımları tip hatasıdır. `InteractionManager` ve `Touchable` kök dışa aktarımı kaldırıldı; `StatusBar`'ın `backgroundColor` ve `translucent` prop'ları yoktur.
- Android release derlemelerinde R8 varsayılan olarak açıktır; lansman öncesi release build mutlaka test edilir.
- Yalnızca mobil hedeflenir; Expo Router'ın web ve sunucu özellikleri (loader, SSR) kullanılmaz. Web hedefi eklenirse SDK 58'de `web.output` varsayılanının `server` olduğu hesaba katılır.
