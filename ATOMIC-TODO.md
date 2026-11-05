# LinguaLink Lite — Atomik Yol Haritası (Tracer Bullet)

> **Yöntem:** Sıfırdan başla. Her adımda AI chat’ten kodu al, **satır satır kendin yaz**. Adım bitince **doğrula**, **tek commit**, **private GitHub’a push**. Sonraki adıma geç.
>
> **Tracer bullet:** İlk adımlarda en ince uçtan uca dilimi çalıştır (Expo “Merhaba” → SQLite’da 1 ders → manuel eşleştir → kaydet → listede gör). Sonra genişlet (AI, Supabase, test, paywall, marketplace, store).
>
> **Nihai hedef:** Plandaki tam ürün — Hexagonal + SOLID mobil uygulama, Free=offline SQLite, Pro=online Supabase, AI phrase-pair eşleştirme + span boyama, flashcard/test/paylaşım, Marketplace, RevenueCat, App Store + Play Store.
>
> **Stack (Kasım 2026):** Expo SDK 58 · React Native 0.88 · React 19.3 · TypeScript 6.0 (Expo şablonunun sürümü; TS 7'ye Expo desteklediğinde geçilir) · Expo Router 58 · expo-sqlite + drizzle · Supabase · **Claude Haiku 5.5** (`claude-haiku-5-5`) · RevenueCat 11.x · Zod 4
>
> **Geliştirme ortamı:** Windows 11 laptop · **Android Studio Emulator** (birincil test yüzeyi) · iOS yalnızca EAS Build (bulut) ile — yerel Xcode yok
>
> **Sütunlar:** `Durum` yok — ilerlemeyi commit geçmişinden takip edersin.

---

## Kurallar (her adımda)

1. **Tek adım = tek commit** (Conventional Commits: `chore:`, `feat:`, `test:`, `fix:`, `docs:`)
2. Adım **doğrulanmadan** commit atma
3. Adım **push edilmeden** sonrakine geçme
4. Anlamadığın satırı commit’leme — önce AI’a sor, sonra yaz
5. Test adımlarında: önce test (kırmızı), sonra implementasyon (yeşil)
6. **Hexagonal:** UI → use case → port ← adapter; `new SupabaseClient()` domain’de yasak
7. **Fiyat / AI limitleri:** `docs/UNIT_ECONOMICS.md` onaylanmadan RevenueCat fiyatı configure etme
8. **UI doğrulama:** Mümkün olduğunca **Android emülatörde** (`npx expo run:android`); Windows’ta `expo run:ios` yok

---

## Geliştirme ortamı — Windows 11 + Android Emulator

| Bileşen | Seçim | Not |
| --- | --- | --- |
| OS | Windows 11 | Birincil geliştirme makinesi |
| Node | 24.16.0 LTS (`.nvmrc`) | `nvm-windows` veya fnm; SDK 58 için ≥24.3 |
| Paket yöneticisi | pnpm 11.x (`packageManager` ile sabit) | Monorepo workspace |
| Android IDE | Android Studio (Ladybug+) | SDK Manager + AVD Manager |
| Emulator | Pixel 6 API 36 x86_64 | ARM emulator Windows’ta yavaş; x86_64 image |
| Ortam değişkenleri | `ANDROID_HOME`, `JAVA_HOME` | Studio kurulumundan sonra sistem PATH |
| Expo çalıştırma | `npx expo run:android` | Native modüller (sqlite, purchases) için dev build |
| Expo Go | Sınırlı kullanım | RevenueCat / tam sqlite testi için yetersiz |
| iOS test | **EAS Build** (`eas build -p ios`) | Windows’ta yerel iOS simülatörü yok; lansman öncesi bulut build |
| Supabase local | Docker Desktop (WSL2 backend) | `supabase start` Edge Functions için |

**Tipik günlük döngü (UI adımları):**

```powershell
cd C:/dev/lang   # Kısa ve ASCII yol; bkz. L-028
# Emülatör Android Studio'dan önceden açık olsun
pnpm --filter @lingualink/mobile android
# veya: cd apps/mobile && npx expo run:android
```

---

## Faz -1 — Prompt kilidi + unit ekonomisi


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-001 | `docs: add unit economics framework` | `docs/UNIT_ECONOMICS.md` iskelet + Claude Haiku 5.5 fiyatları | COGS modeli prompt ve fiyattan önce çerçeve | Dosya var |
| L-001b | `docs: lock align system prompt v1` | `docs/SYSTEM_PROMPT.md` v3 — sabit sistem promptu, pairs JSON, scope (app boyar) | Token ölçümü ve Edge Function tek kaynak | Dosya kilitli |
| L-001c | `docs: add generate system prompt v1` | `docs/GENERATE_SYSTEM_PROMPT.md` v3 — yalnızca metin + çeviri (pairs yok) | Premium ders üretimi; eşleştirme ayrı `align-text` çağrısı | Dosya var |
| L-001d | `docs: add span mapping architecture` | `docs/SPAN_MAPPING.md` — MapPairsToSpans, palet, tap/TTS/drag | AI renk/konum döndürmez; uygulama sorumluluğu net | Dosya var |
| L-001e | `docs: add language pair hints` | `docs/LANGUAGE_PAIR_HINTS.md` — 12 dil + grammar_hints injection | Global uygulama; dinamik dil çifti | Dosya var |
| L-002 | `docs: benchmark ai token usage` | `claude-haiku-5-5` ile generate ve align ayrı ölç (`UNIT_ECONOMICS.md` §4.1) | Tahmin değil ölçüm; cap ve fiyat buradan | Tablo dolu, COGS + doğrulama oranı yazılı |
| L-003 | `docs: compute pro ai monthly caps` | Free 1/gün, Pro/Lifetime aylık cap — Haiku 5.5 COGS ile (thinking token'ları dahil) | Sınırsız AI yok; Lifetime aylık cap zorunlu | Cap rakamları yazılı |
| L-004 | `docs: compute pricing scenarios` | 3 senaryo + break-even; store %30 | Fiyat onaysız configure edilmez | Sen onayladın mı? |
| L-005 | `docs: lock billing constants` | `docs/BILLING_CONSTANTS.md` (L-020’de TS’ye taşınır) | Onaylı cap/fiyat placeholder tek dosya | Dosya var |


> **Kapı:** L-001b–e bitmeden L-002’ye geçme. L-004 onayı olmadan L-222+ (RevenueCat fiyat) yok.

---

## Faz 0 — Boş repo ve monorepo iskeleti


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-010 | `chore: init git repository` | Boş `Lang/`, `git init`, `README.md` (1 paragraf: LinguaLink ne yapar) | Versiyon kontrolü ve GitHub private repo’nun temeli | `git status` temiz |
| L-011 | `chore: add gitignore and nvmrc` | `.gitignore`, `.nvmrc` (24.16.0), `.npmrc` (engine-strict) | Node sürüm tutarlılığı; `.env` ve build artifact’ları repoya girmez | Dosyalar var |
| L-012 | `chore: add root package.json and pnpm workspace` | Root `package.json`, `pnpm-workspace.yaml` (`apps/*`, `packages/*`, `supabase`) | Monorepo ile mobile + contracts + edge functions aynı repoda | `pnpm --version` OK |
| L-013 | `chore: add tsconfig base` | `tsconfig.base.json` — strict, `noUncheckedIndexedAccess` | TypeScript 6 strict; runtime hatalarını compile-time yakalar | — |
| L-014 | `chore: add env example template` | `.env.example` — Supabase, `ANTHROPIC_API_KEY` (yorum: yalnızca edge), RevenueCat placeholder | Hangi secret’ın nereye gittiğini öğrenirsin; client’a API key gitmez | `.env` gitignore’da |
| L-015 | `chore: add hexagonal folder convention doc` | `docs/ARCHITECTURE.md` — bounded context listesi + klasör şablonu | Her feature aynı yapıda; SOLID ihlalini erken görürsün | Dosya okunabilir |
| L-016 | `chore: add agents and cursor rules skeleton` | `AGENTS.md`, `.cursor/rules/hexagonal.mdc`, `.cursor/rules/solid.mdc` | AI-assisted yazımda katman sınırları korunur | Dosyalar var |


---

## Faz 1 — Paylaşılan sözleşmeler (`packages/contracts`)


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-020 | `feat(contracts): scaffold package` | `packages/contracts/package.json`, `tsconfig.json`, `src/index.ts` | Mobil ve Edge Function aynı Zod şemalarını paylaşır — tip uyumsuzluğu önlenir | `pnpm --filter @lingualink/contracts typecheck` |
| L-021 | `feat(contracts): add LanguageCode enum` | 12 dil: en, tr, es, de, fr, it, pt, ja, ko, ar, zh, ru | Hedef ve ana dil aynı listeden seçilir (ürün kuralı) | typecheck |
| L-022 | `feat(contracts): add AlignmentPair schema` | `order`, `source`, `target` — AI çıktısı; renk yok | Flat pair list; AlignmentTree kaldırıldı | typecheck |
| L-023 | `feat(contracts): add AlignmentPairList schema` | `pairs: AlignmentPair[]` + `HIGHLIGHT_PALETTE` sabiti | Edge → mobil parse; renk uygulama atar | typecheck |
| L-024 | `feat(contracts): add Lesson and MappedPair schemas` | `Lesson`, `TextSpan`, `MappedPair` (start/end/color) | SQLite + span mapping sonucu | typecheck |
| L-025 | `feat(contracts): add TestQuestion schema` | `type: word \| sentence \| paragraph`, `prompt`, `choices`, `correctIndex` | Test modları contract-first tanımlanır | typecheck |
| L-026 | `feat(contracts): add EntitlementTier schema` | `free \| pro \| lifetime` | Free/Pro storage ve feature gate tek tip | typecheck |
| L-027 | `feat(contracts): export public API` | `src/index.ts` re-export | Diğer paketler tek import path | import edilebilir |


---

## Faz 2 — Windows Android ortamı + Expo tracer


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-028 | `docs: document windows android dev setup` | `docs/DEV_SETUP_WINDOWS.md` — Android Studio, SDK 36, AVD, `ANDROID_HOME`, `JAVA_HOME`; repo `C:\dev\lang` gibi kısa, ASCII bir yolda | Windows 11’de tekrarlanabilir kurulum; `Arşiv` gibi ASCII olmayan ve uzun yollar native build'i bozabilir | `adb devices` emülatör görünür |
| L-029 | `chore: verify android emulator smoke` | Boş Expo yokken: `adb shell getprop ro.build.version.release` | Emülatör çalışıyor mu commit zincirine girmeden önce doğrulanır | API 36 cevap |
| L-030 | `feat(mobile): scaffold expo sdk 58 app` | `npx create-expo-app@latest --template default@sdk-58` → `apps/mobile`, TypeScript | Çalışan en ince mobil iskelet; tracer bullet emülatörde doğrulanır | `npx expo start` → `a` ile Android |
| L-031 | `feat(mobile): add expo router entry` | `app/_layout.tsx`, `app/index.tsx` — “LinguaLink” başlık | File-based routing tüm ekranların omurgası | **Android emülatörde** açılır |
| L-032 | `feat(mobile): add workspace dependency to contracts` | `apps/mobile` → `@lingualink/contracts` workspace link | Monorepo tip paylaşımı mobilde çalışıyor mu erken test | typecheck mobile |
| L-033 | `chore(mobile): add eas.json development profile` | `eas.json` — development + preview profilleri | RevenueCat ve sqlite native modüller Expo Go’da tam çalışmaz; dev build şart | dosya var |
| L-034 | `docs: document expo android dev client on windows` | README: `npx expo run:android` (birincil); iOS = EAS cloud only | Windows’ta yerel iOS yok; yanlış beklenti önlenir | README okunabilir |
| L-035 | `chore(mobile): first android dev build` | `npx expo run:android` — development client emülatöre yüklensin | Sonraki tüm native modül adımları bu build ile test edilir | uygulama emülatörde açılır |


> **Tracer bullet #0:** Android emülatörde uygulama açılıyor.

---

## Faz 3 — Hexagonal iskelet + domain çekirdeği (`lessons` context)


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-040 | `feat(lessons): add domain folder skeleton` | `src/features/lessons/{domain,application,infrastructure,presentation}` | Hexagonal şablon; her yeni feature kopyalanır | klasörler var |
| L-041 | `test(lessons): add Lesson entity tests` | `Lesson.spec.ts` — boş başlık fail, geçerli lesson pass | Test-first domain; entity kuralları net | test FAIL |
| L-042 | `feat(lessons): implement Lesson entity` | `domain/entities/Lesson.ts` | İş kuralı UI’dan izole | test PASS |
| L-043 | `feat(lessons): add LanguageCode value object` | `domain/value-objects/LanguageCode.ts` — contracts’tan validate | Geçersiz dil kodu domain’e sızmaz | test PASS |
| L-044 | `feat(lessons): define ILessonReader port` | `domain/ports/ILessonReader.ts` | Interface segregation — okuma ayrı port | typecheck |
| L-045 | `feat(lessons): define ILessonWriter port` | `domain/ports/ILessonWriter.ts` | Yazma ayrı port; Liskov için küçük kontrat | typecheck |
| L-046 | `test(lessons): add SaveLessonUseCase tests` | mock reader/writer ile spec | Use case davranışı adapter’dan bağımsız test edilir | test FAIL |
| L-047 | `feat(lessons): implement SaveLessonUseCase` | `application/SaveLessonUseCase.ts` | Tek sorumluluk: ders kaydetme orchestration | test PASS |
| L-048 | `feat(lessons): add InMemoryLessonRepository` | test adapter — Map tabanlı | SQLite gelmeden use case’leri çalıştırırsın (hızlı tracer) | test PASS |


---

## Faz 4 — Dil registry (12 dil, hedef = ana dil)


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-050 | `feat(languages): add domain LanguageRegistry` | `features/languages/domain/LanguageRegistry.ts` — 12 dil meta (kod, native ad, RTL flag) | Onboarding ve ders oluşturma aynı listeyi kullanır | unit test |
| L-051 | `feat(languages): add GetLanguagesUseCase` | liste döndür | Presentation domain’e doğrudan erişmez | test PASS |
| L-052 | `feat(languages): add LanguagePicker component` | `presentation/LanguagePicker.tsx` — flat list | Kullanıcı hedef ve ana dili seçebilir | Android emülatörde liste |
| L-053 | `feat(languages): persist selected langs in async storage` | `IUserPreferencesPort` + adapter | Seçimler uygulama restart’ta kalır | restart sonrası seçili |


---

## Faz 5 — SQLite offline depolama (Free tier temeli)


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-060 | `feat(mobile): install expo-sqlite and drizzle` | `npx expo install expo-sqlite`, drizzle-orm | Free kullanıcı dersleri yalnızca cihazda — offline-first ürün kuralı | install OK |
| L-061 | `feat(lessons): add sqlite schema` | `lessons`, `alignment_pairs` — order, phrases, span index, color | Düz pair listesi + map sonucu index’ler | migration çalışır |
| L-062 | `feat(lessons): add SqliteLessonReader adapter` | `ILessonReader` impl | Free tier’ın birincil depolama adaptörü | read test PASS |
| L-063 | `feat(lessons): add SqliteLessonWriter adapter` | `ILessonWriter` impl | Kayıt offline; sunucu maliyeti sıfır | write + read roundtrip |
| L-064 | `feat(lessons): wire SaveLessonUseCase to sqlite` | composition root / DI module | Tracer: emülatörde kalıcı kayıt (dev build gerekir) | ders DB’de |
| L-065 | `feat(lessons): add free tier max 2 active lessons rule` | domain `LessonQuotaPolicy` | Free limit ürün kararı; domain’de enforce | 3. ders reddedilir |


---

## Faz 6 — Ders editörü tracer (yapıştır → hazırla)


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-070 | `feat(lessons): add PrepareTextsUseCase` | ham metin → `LessonDraft` (sourceText, targetText) | “Metinleri Hazırla” butonunun iş kuralı UI’dan ayrılır | unit test |
| L-071 | `feat(lessons): add CreateLessonScreen shell` | `app/(tabs)/create.tsx` — iki TextInput + buton | Kullanıcı akışının ana giriş ekranı | Android emülatör |
| L-072 | `feat(lessons): wire prepare button to use case` | state: draft göster | Tracer: yapıştır → hazırla → alt kutuda metin | metin görünür |
| L-073 | `feat(lessons): add interactive text renderer` | token span listesi (henüz renk yok) | Manuel seçim için tıklanabilir kelime/kelime grupları gerekir | tıklanır span |


---

## Faz 7 — Manuel eşleştirme (renkli highlight)


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-080 | `feat(alignment): add ManualMatchUseCase` | seçili source span + target span → segment çifti | AI olmadan eşleştirme mümkün; pedagojik kontrol | unit test |
| L-081 | `feat(alignment): add segment selection state hook` | `useSegmentSelection.ts` | Presentation’da selection logic izole | iki span seçilir |
| L-082 | `feat(alignment): add color index per match` | `ColorIndex` value object, döngüsel palet | Görsel 1’deki gibi farklı renkler öğrenmeyi kolaylaştırır | renkler görünür |
| L-083 | `feat(alignment): add Match button and pair list` | “Seçili İfadeleri Eşleştir” | Kullanıcı adım adım eşleşme oluşturur | çift listelenir |
| L-084 | `feat(alignment): add clear selection buttons` | İngilizce/Türkçe seçimi temizle | Yanlış seçim düzeltmesi | temizlenir |
| L-085 | `feat(lessons): save lesson with segments` | SaveLesson + segment persist | Tracer bullet #1: manuel ders kaydı uçtan uca | SQLite’da ders |


> **Tracer bullet #1:** Yapıştır → hazırla → manuel eşleştir → kaydet.

---

## Faz 8 — Kayıtlı dersler listesi


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-090 | `feat(lessons): add ListLessonsUseCase` | tüm dersleri listele | Lessons ekranı use case üzerinden | test PASS |
| L-091 | `feat(lessons): add LessonsScreen` | `app/(tabs)/lessons.tsx` — kart listesi, tarih | Kayıtlı derslere tekrar erişim | kayıtlı ders görünür |
| L-092 | `feat(lessons): add LoadLessonUseCase` | tek ders + alignment_pairs | Düzenleme ve test için yükleme | edit açılır |
| L-093 | `feat(lessons): add DeleteLessonUseCase` | soft veya hard delete | Kullanıcı ders yönetimi | silince listeden düşer |
| L-094 | `feat(lessons): add bottom tabs navigator` | create + lessons tab | Ana navigasyon iskeleti | tab geçişi |


---

## Faz 9 — Supabase yerel proje


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-100 | `chore(supabase): init local project` | `supabase init`, `config.toml` | Pro tier cloud storage ve paylaşım için backend | `supabase start` |
| L-101 | `feat(supabase): add profiles migration` | `profiles` — `tier`, `ui_locale` | Kullanıcı tier bilgisi RLS ile korunur | Studio’da tablo |
| L-102 | `feat(supabase): add lessons cloud migration` | `lessons`, `alignment_pairs` cloud mirror | Pro online depolama şeması | migration apply |
| L-103 | `feat(supabase): enable RLS owner policies` | `auth.uid() = user_id` | Başka kullanıcının dersine erişim engeli | policy test |
| L-104 | `feat(supabase): add shared_decks migration` | `share_slug`, `payload jsonb` | Deep link paylaşım veri modeli | tablo var |
| L-105 | `feat(supabase): add ai_usage migration` | günlük/aylık alignment + generation sayacı | Free 1/gün ve Pro cap sunucuda enforce | tablo var |


---

## Faz 10 — Auth (Supabase)


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-110 | `feat(mobile): add supabase client adapter` | `infrastructure/SupabaseClient.ts` — anon key only | Auth ve Pro sync için client; service key mobilde yok | bağlantı OK |
| L-111 | `feat(auth): add IAuthService port` | signIn, signUp, signOut, session | Domain auth soyutlaması | typecheck |
| L-112 | `feat(auth): add AuthScreen` | email + password + Apple (sonra) | Pro tier ve paylaşım için kullanıcı kimliği | giriş yapılır |
| L-113 | `feat(auth): add session gate in root layout` | oturum yoksa Supabase anonim oturum | Free kullanıcı kayıtsız başlar ama AI kotası için `user_id` gerekir; Pro için hesaba yükseltilir | anonim oturumda kota sayılır |


---

## Faz 11 — Pro online depolama + tier routing


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-120 | `feat(lessons): add SupabaseLessonReader` | cloud read adapter | Pro kullanıcı dersleri cloud’da | read OK |
| L-121 | `feat(lessons): add SupabaseLessonWriter` | cloud write adapter | Free offline / Pro online ürün kuralı | write OK |
| L-122 | `feat(billing): add IEntitlementService port` | `getTier(): EntitlementTier` | Storage routing tek yerden | mock test |
| L-123 | `feat(lessons): add StorageRouter` | tier’a göre sqlite veya supabase | Open/Closed: yeni adapter eklemek use case değiştirmez | free→sqlite, pro→cloud |
| L-124 | `feat(lessons): add MigrateLocalToCloudUseCase` | Pro’ya geçişte tek seferlik taşıma | Kullanıcı veri kaybı yaşamaz | migrate sonrası cloud’da |
| L-125 | `test(lessons): storage router integration tests` | tier mock ile iki adapter | Liskov: her iki repo aynı kontratı karşılar | tests PASS |


---

## Faz 12 — AI alignment: stub + span boyama


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-130 | `feat(alignment): define IAlignmentService port` | `align(...): AlignmentPairList` | AI sağlayıcı değişse use case değişmez | typecheck |
| L-131 | `feat(alignment): add MapPairsToSpansUseCase` | pairs → MappedPair[] + palet + coverage validate | Boyama AI’da değil uygulamada (`SPAN_MAPPING.md`) | unit test PASS |
| L-132 | `feat(alignment): add HighlightText component` | üst hedef / alt ana dil kutusu, renkli span | Kullanıcı eşleşmeyi görür | Android emülatör |
| L-133 | `feat(alignment): add tap sync between boxes` | tık → karşı span highlight | Öğrenme: ilişkiyi görmek | iki kutu sync |
| L-134 | `feat(alignment): add SpeakPairUseCase` | tık → expo-speech hedef dil | Otomatik telaffuz | ses duyulur |
| L-135 | `feat(supabase): add align-text edge function skeleton` | CORS + auth + stub pairs JSON | API key sunucuda | functions serve |
| L-136 | `feat(alignment): add StubAlignmentAdapter` | sabit pairs[] örnek (young boy cümlesi) | Gerçek AI öncesi uçtan uca pipeline | renkli boyama |
| L-137 | `feat(alignment): add AlignTextUseCase` | port + MapPairsToSpans zinciri | Application orchestration | unit test |
| L-138 | `feat(alignment): add AI Eşleştir button` | error + ~12 sn beklemeye uygun ilerleme göstergesi | Sihir anı UX; eşleştirme anlık değil | stub çalışır |
| L-139 | `feat(alignment): add RealignPairUseCase mvp` | basılı tut + sürükle → pair düzelt | Yanlış AI eşleşmesi düzeltmesi | drag çalışır |


> **Tracer bullet #2:** Stub pairs → MapPairsToSpans → renkli UI + tap/TTS.

---

## Faz 13 — Prompt factory + gerçek Claude Haiku 5.5


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-140 | `feat(prompts): add prompt template package` | `packages/prompts/` — sabit `ALIGN_SYSTEM_PROMPT` + `buildAlignmentUserMessage()` | Sistem promptu sabit, bağlam kullanıcı mesajında | unit test |
| L-141 | `feat(prompts): add buildGrammarHints` | `LANGUAGE_PAIR_HINTS.md` → kod | 12 dil çifti desteği | en-tr test |
| L-142 | `feat(prompts): wire GENERATE_SYSTEM_PROMPT` | sabit `GENERATE_SYSTEM_PROMPT` + `buildGenerateUserMessage()` | Premium ders üretimi | prompt string |
| L-143 | `feat(alignment): add ClaudeHaikuAdapter` | `claude-haiku-5-5`, `messages.parse` + `zodOutputFormat`, `effort: "low"`; `temperature` yok | Şema uyumlu çıktı + düşük COGS; sağlayıcı port arkasında | invoke OK |
| L-144 | `feat(alignment): add AlignmentValidator` | `ALIGN_VALIDATION.md` kuralları ve test matrisi | Şema kaplamayı garanti etmez; AI hatası uygulamaya sızmaz | invalid → 422 |
| L-145 | `feat(alignment): add sentence chunked alignment` | `splitIntoSentences` + cümle başına align + `order` birleştirme | Uzun metinde cümle kaymasını önler | 200 kelime testi geçer |
| L-146 | `feat(alignment): handle refusal and retry` | `stop_reason` kontrolü, 1 yeniden deneme, manuel moda düşüş | Haiku 5.5'te sunucu tarafı fallback yok | refusal → manuel mod |
| L-147 | `feat(alignment): wire mobile to real edge function` | stub kaldır | Tracer bullet #3 | Android: ilerleme göstergesi görünür, yanıt ~12 sn içinde gelir |
| L-148 | `feat(alignment): add manual override after AI` | sürükle + manuel eşleştir | AI düzeltme | edit + re-save |


> **Tracer bullet #3:** Gerçek Claude Haiku 5.5 alignment.

---

## Faz 14 — AI kullanım limitleri (tier)


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-150 | `feat(usage): add CheckAiQuotaUseCase` | edge başında günlük/aylık sayaç | Sınırsız AI zararını sunucu durdurur | free 2. istek 429 |
| L-151 | `feat(usage): increment ai_usage in edge` | başarılı alignment sonrası +1 | COGS telemetry ve limit için kayıt | DB sayacı artar |
| L-152 | `feat(alignment): show paywall prompt on 429` | mobilde limit mesajı | Free → Pro dönüşüm fırsatı | mesaj görünür |
| L-153 | `feat(obs): log alignment duration and token estimate` | PostHog event iskeleti | Çağrı P95 ≤12 sn hedefi ve unit ekonomisi gerçek veri | event dashboard |


---

## Faz 15 — Flashcards (ayrı menü)


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-160 | `feat(flashcards): add domain FlashcardCard entity` | front/back, pairOrder, lessonId | Flashcard domain ayrı context | unit test |
| L-161 | `feat(flashcards): add BuildDeckUseCase` | alignment_pairs’ten kart destesi | Kullanıcı kayıtlı dersten çalışır (Madde 7) | test PASS |
| L-162 | `feat(flashcards): add FlashcardsScreen tab` | `app/(tabs)/flashcards.tsx` — ayrı menü | Lessons’tan bağımsız tekrar modu | tab görünür |
| L-163 | `feat(flashcards): add card flip UI` | ön/hedef, arka/ana dil | Klasik flashcard deneyimi | flip çalışır |
| L-164 | `feat(flashcards): add know dont know actions` | shuffle, basit ilerleme | MVP SRS yok; random shuffle yeterli | deste ilerler |
| L-165 | `feat(flashcards): add lesson filter picker` | hangi derslerden kart | Çoklu ders destesi | filtre çalışır |
| L-166 | `feat(flashcards): add expo-speech TTS pro gate` | Pro’da İngilizce telaffuz | Free/Pro farkı; Pro değer artışı | Pro’da ses |


---

## Faz 16 — Öğrenme testi: random (Free)


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-170 | `feat(tests): add GenerateQuestionsUseCase` | segmentlerden MCQ üret | Test iş kuralı UI’dan izole | unit test |
| L-171 | `feat(tests): add word level question generator` | kısa pair (≤3 kelime) | Kelime/kelime grubu soruları | soru üretilir |
| L-172 | `feat(tests): add sentence level generator` | tam source_text / uzun pair | Cümle tipi sorular | soru üretilir |
| L-173 | `feat(tests): add paragraph level generator` | birleşik metin bloğu | Paragraf tipi sorular | soru üretilir |
| L-174 | `feat(tests): add distractor picker` | aynı derslerden 3 yanlış şık | MCQ kalitesi | 4 şık unique |
| L-175 | `feat(tests): add TestScreen random mode` | `app/(tabs)/test.tsx` | Free yalnızca random (Madde 6) | random başlar |
| L-176 | `feat(tests): add answer feedback UI` | doğru yeşil / yanlış kırmızı + doğru cevap | Görsel 2 UX | feedback görünür |
| L-177 | `feat(tests): add test session complete screen` | skor özeti | Tamamlanma hissi + review tetikleyici hazırlığı | skor görünür |


---

## Faz 17 — Test: ders seçimi (Pro only)


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-180 | `feat(tests): add StartTestUseCase tier gate` | free → yalnız `random` | Ürün kuralı Madde 6 | free’de select gizli |
| L-181 | `feat(tests): add lesson multi-select UI` | checkbox ile 1+ ders | Pro kullanıcı hedefli çalışır | pro’da seçim |
| L-182 | `feat(tests): add mixed question type session` | word+sentence+paragraph karışık | Kapsamlı sınav deneyimi | karışık sorular |
| L-183 | `feat(tests): persist TestResult locally` | skor geçmişi basit sayaç | “Tamamlanan test sayısı” metrik | sayaç artar |


---

## Faz 18 — Paylaşım ve deep link


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-189 | `feat(sharing): add IShareService port` | bundle oluştur, slug al | Paylaşım altyapısı soyut | typecheck |
| L-190 | `feat(sharing): add ShareDecksUseCase` | 1+ ders → `shared_decks` insert | Viral loop temeli | slug döner |
| L-191 | `feat(sharing): add tier gate max 3 free max unlimited pro` | Free max 3 ders, Pro 4+ | Madde 8 ürün kuralı | free 4. ders reddedilir |
| L-192 | `feat(mobile): configure scheme lingualink` | `app.config.ts` scheme + intent filters | `lingualink://deck/xyz` deep link | link açılır |
| L-193 | `feat(sharing): add ImportDeckUseCase` | deep link → local/cloud import | Alıcı paylaşılan dersi alır | import sonrası listede |
| L-194 | `feat(sharing): add share sheet button on lessons screen` | native share API | Tek tık paylaşım | share sheet açılır |
| L-195 | `feat(sharing): add deck shareId route` | `app/deck/[shareId].tsx` | Universal link giriş noktası | cold start import |


---

## Faz 19 — Premium AI ders üretimi


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-200 | `feat(prompts): add buildLessonGenerationPrompt` | topic + langs + difficulty | Kullanıcı kendi cümlesini bulmak zorunda değil (Madde 11) | prompt test |
| L-201 | `feat(supabase): add generate-lesson edge function` | yalnızca source_text + target_text; ardından `align-text` | Premium ders üretimi (`GENERATE_SYSTEM_PROMPT.md`); benchmark tek geçişin bozulduğunu gösterdi | invoke OK |
| L-202 | `feat(lessons): add GenerateLessonUseCase` | Pro gate + quota | Free bu özelliği kullanamaz | free blocked |
| L-203 | `feat(lessons): add topic input and generate button UI` | create ekranında Pro bölümü | UX: konu gir → ders hazır | pro’da ders oluşur |


---

## Faz 20 — Onboarding + i18n (EN, TR, ES UI)


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-210 | `feat(i18n): setup i18next` | `src/i18n/`, `en.json`, `tr.json`, `es.json` | Lansman UI dilleri (plandaki 3 dil) | dil değişir |
| L-211 | `feat(onboarding): add onboarding flow screens` | hedef dil, ana dil, günlük hedef | Kişiselleştirme + paywall öncesi bağlam | akış tamamlanır |
| L-212 | `feat(onboarding): add plan preparing animation` | 2-3sn loading animasyonu | Paywall öncesi algılanan değer (lansman boost) | animasyon görünür |
| L-213 | `feat(onboarding): persist onboarding complete flag` | bir kez göster | Tekrarlayan onboarding churn yaratır | ikinci açılış atlanır |


---

## Faz 21 — RevenueCat + Paywall


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-220 | `feat(mobile): install react-native-purchases` | `npx expo install react-native-purchases react-native-purchases-ui` | IAP Expo SDK 58 resmi yolu; dev build gerekir | dev build OK |
| L-221 | `feat(billing): add RevenueCatEntitlementAdapter` | `IEntitlementService` impl | Gerçek tier RevenueCat’ten gelir | sandbox tier |
| L-222 | `feat(billing): configure products from UNIT_ECONOMICS` | monthly, yearly, lifetime product ids | Onaylı fiyatlar dışında configure yok (L-004 kapısı) | products match doc |
| L-223 | `feat(billing): add PaywallScreen` | onboarding sonunda RevenueCat UI | Anında paywall lansman geliri | paywall görünür |
| L-224 | `feat(billing): wire StorageRouter to live entitlement` | satın alma sonrası cloud’a geç | Pro satın alınca online depolama aktif | pro→supabase |


---

## Faz 22 — Review prompt + konfeti


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-230 | `feat(mobile): install expo-store-review` | native review API | İlk 5 yıldız ASO boost (plandaki tetikleyici) | paket OK |
| L-231 | `feat(growth): add ReviewPromptUseCase` | ilk ders kaydı + test %100 koşulu | Dopamin anında puanlama istemi | koşul sağlanınca tetik |
| L-232 | `feat(growth): add confetti on perfect test` | görsel kutlama | Review prompt ile eşzamanlı pozitif duygu | konfeti + review |


---

## Faz 23 — Marketplace


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-240 | `feat(supabase): add market_listings migration` | title, payload, price_cents, seller_id | Ders paylaş/sat altyapısı (Madde 12) | tablo var |
| L-241 | `feat(marketplace): add ListListingsUseCase` | ücretsiz + ücretli liste | Keşif ekranı | listeler gelir |
| L-242 | `feat(marketplace): add PublishListingUseCase` | ücretsiz herkes, satış Pro | Creator monetization Pro’ya özel | free satış blocked |
| L-243 | `feat(marketplace): add MarketScreen tab` | `app/(tabs)/market.tsx` | Ayrı market menüsü | tab açılır |
| L-244 | `feat(marketplace): add purchase flow stub` | price>0 → RevenueCat veya IAP consumable TBD | Satış tamamlama — payout modeli sonra | stub flow |
| L-245 | `feat(marketplace): add download listing to lessons` | import bundle | Alıcı marketten ders alır | ders import |


---

## Faz 24 — Observability


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-250 | `feat(obs): integrate sentry react native` | crash capture | Store kalite sinyali crash-free sessions | test crash |
| L-251 | `feat(obs): integrate posthog` | funnel events listesi (plandaki) | D1/D3, paywall CVR, AI sihir anı ölçümü | dashboard event |
| L-252 | `feat(obs): add ai cost telemetry events` | token estimate per user per action | Unit ekonomisi gerçek veriyle güncellenir | event gelir |


---

## Faz 25 — EAS Build + Store Submit


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-260 | `chore(eas): add production build profile` | Android + iOS (iOS = EAS cloud, Windows’ta yerel build yok) | Store’a giden binary | `eas build -p android` OK |
| L-261 | `docs: add privacy policy and terms urls` | AI/Anthropic, veri saklama, KVKK; metin AI'a gönderilmeden önce uygulama içi açık onay | Store zorunlu metadata | URL’ler canlı |
| L-262 | `chore(store): play console listing tr en es` | screenshot (emülatörden), açıklama, ASO | Windows geliştirmede **Android önce** lansman | listing draft |
| L-263 | `chore(store): play internal testing submit` | Android beta | Geliştirme boyunca kullandığın yüzeyde son doğrulama | internal OK |
| L-264 | `chore(eas): ios build via eas cloud` | `eas build -p ios` — Mac gerekmez | Windows’tan iOS binary yalnızca EAS ile | .ipa artifact |
| L-265 | `chore(store): app store connect metadata` | screenshot, açıklama (iOS boyutları) | iOS lansman ikinci dalga veya paralel | metadata draft |
| L-266 | `chore(eas): testflight internal submit` | iOS beta (EAS Submit) | iOS gerçek cihaz doğrulaması | TestFlight OK |
| L-267 | `feat(mobile): add app links android intent filters` | `lingualink.app` + Android App Links | HTTPS deep link (Windows’ta emülatörde test) | `adb` link test |
| L-268 | `feat: tag mvp-store-v1` | git tag | Lansman snapshot | tag var |


> **Tracer bullet #4 (MVP Store):** Play Internal (Windows’ta doğrulanmış) → ardından EAS iOS + TestFlight.

---

## Faz 26 — MVP sonrası cilalama (nihai hedef tamamlayıcı)


| ID | Commit | Ne yaparsın | Neden yaparsın | Doğrula |
| --- | --- | --- | --- | --- |
| L-270 | `feat(lessons): add export json pro gate` | ders bundle .json | Pro değer: yedekleme/ taşıma | export dosyası |
| L-271 | `feat(lessons): add export anki format pro gate` | Anki uyumlu | Anki kitlesi Lifetime hedefi | anki import edilir |
| L-272 | `feat(tests): add srs spaced repetition v2` | flashcard + test SRS | Uzun vadeli retention artışı | SRS çalışır |
| L-273 | `feat(auth): add sign in with google and apple` | Google (Android önce test); Apple (iOS build sonrası) | Play Store Google login yaygın; Apple iOS guideline | Google emülatörde OK |
| L-274 | `feat(marketplace): add creator payout stripe connect` | satış geliri payı | Marketplace sürdürülebilir gelir | payout test |
| L-275 | `feat: tag feature-complete-v1` | git tag | Nihai plan hedefi tamamlandı | tag var |


---

## Özet: Faz → Tracer Milestone


| Milestone | Son adım | Ne çalışır |
| --- | --- | --- |
| **M-1** Unit ekonomisi | L-005 | Onaylı cap ve fiyat senaryoları |
| **M0** Repo | L-016 | Monorepo + hexagonal dokümantasyon |
| **M1** Contracts | L-027 | Paylaşılan Zod şemaları |
| **M2** Expo açılır | L-035 | Android emülatörde uygulama + dev build |
| **M3** Domain çekirdek | L-048 | SaveLesson use case + in-memory |
| **M4** Offline kayıt | L-065 | SQLite + Free 2 ders limiti |
| **M5** Manuel tracer | L-085 | Yapıştır → eşleştir → kaydet |
| **M6** Ders listesi | L-094 | Tabs: create + lessons |
| **M7** Auth + cloud şema | L-113 | Supabase + giriş |
| **M8** Pro storage | L-125 | Tier’a göre sqlite/cloud |
| **M9** Stub AI UI | L-139 | pairs → span boyama + tap/TTS |
| **M10** Gerçek AI | L-148 | Claude Haiku 5.5 canlı |
| **M11** Flashcards | L-166 | Ayrı tab + TTS Pro |
| **M12** Test Free | L-177 | Random quiz 3 soru tipi |
| **M13** Test Pro | L-183 | Ders seçerek test |
| **M14** Paylaşım | L-195 | Deep link import |
| **M15** AI ders üret | L-203 | Premium tek tık |
| **M16** Paywall | L-224 | RevenueCat canlı |
| **M17** Marketplace | L-245 | Listele + indir |
| **M18** Store beta | L-268 | Play Internal + EAS iOS TestFlight |
| **M19** Nihai | L-275 | Export, SRS, payout, tam tag |


---

## Seninle çalışma protokolü (batch modu)

### Sen nasıl başlatırsın?

Örnek mesaj:

> *“Hadi Faz -1 — Unit ekonomisi içindeki L-001, L-002, L-003, L-004, L-005 bölümlerini birlikte yapalım; istersen tek seferde istersen parça parça.”*

veya:

> *“L-040–L-043’e geçelim.”*

### Ben nasıl cevap veririm?

Her batch cevabında şu yapı **zorunlu**:

1. **Batch önerisi** — kaç adım mantıklı (varsayılan ~4+4; uzun/kısa fazlarda esnek)
2. **Ön hazırlık** (varsa) — batch’ten önce tek seferlik kurulum (ör. vitest, Android emülatör açık)
3. **Her adım için blok:**
   - **ID + başlık**
   - **Ne?** — tek cümle
   - **Neden?** — iş gerekçesi
   - **Alternatifler** (varsa) — tablo: alternatif / eksi
   - **Dosya(lar)** — tam yol + YENİ/GÜNCELLE
   - **Kod** — kopyala-yapıştır değil; satır satır yazman için tam içerik
   - **Doğrula** — çalıştırılacak komut + beklenen çıktı (FAIL/PASS)
   - **Commit** — `git add …` + `git commit -m "…"` + `git push`
4. **Batch özeti tablosu** — ID → çıktı
5. **Sonraki batch önizlemesi** — bitince ne yazacağın

### Ritüel kuralları

| Kural | Açıklama |
| --- | --- |
| Tek adım = tek commit | Batch’te 4 adım = 4 ayrı commit |
| Doğrula → commit → push | Sıra değişmez |
| Test-first | Test adımlarında önce kırmızı, sonra yeşil |
| UI adımları | Android emülatör önceden açık; gerekirse `npx expo run:android` |
| Anlamadığın satır | Commit’leme; sor, sonra yaz |
| Batch bitti | *“L-0XX–L-0YY bitti”* de → sonraki batch |

### Örnek cevap iskeleti (AI tarafı)

```markdown
4+4 ile ilerlemek daha iyi: her adım = bir commit …

Bu mesajda L-001 → L-004. Bitirince commit/push; sonra "L-005'e geçelim" yaz.

## Ön hazırlık (L-001'den önce, tek sefer)
…

## L-001 — …
**Ne?** …
**Neden?** …
**Dosya:** `docs/UNIT_ECONOMICS.md` (YENİ)
…
**Doğrula:** …
**Commit:** `git commit -m "docs: …"`

## Batch özeti
| ID | Çıktı |
| L-001 | … |

**Sonraki:** L-005 veya L-010–L-013
```

### Önerilen başlangıç sırası

1. `L-001`…`L-001e` — ekonomi iskelet + prompt kilidi
2. `L-002`…`L-005` — token ölçüm + cap + fiyat
3. `L-010`…`L-016` — repo iskeleti → GitHub private remote
4. `L-028`…`L-035` — Windows Android ortamı + ilk emülatör build
5. Sonraki fazlar tablo sırasıyla

**GitHub:** `L-010` sonrası `git remote add origin` + ilk push.

---

*Son güncelleme: 2026-11-05 — Claude Haiku 5.5 · Expo SDK 58 · generate/align ayrımı + AlignmentValidator · flat pairs + span mapping · Windows Android Emulator · Batch protokol v2*
