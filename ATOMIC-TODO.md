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
> **Durum:** Her adım bir onay kutusudur. Adım bitince `- [ ]` yerine `- [x]` yaz; işaretli adım VS Code ve Cursor önizlemesinde soluk ve renksiz görünür (`docs/markdown-preview.css`). Ayrıntı: "İlerleme" bölümü.

---

## İlerleme (son güncelleme: 2026-11-07)

- `[x]` Adımın `Doğrula` ölçütü karşılandı.
- `[ ] 🟡` Çalışan bir karşılığı var, ama plandaki hâlinden eksik veya farklı; kalan iş adımın altındaki **Durum** satırında. Bu adımlar tamamlanınca işaretlenir.
- `[ ]` Yapılmadı.

Şu an: 54 tamam, 38 kısmi, 79 açık.

Android prototipi (`apps/mobile`, `packages/ai`) plan sırası dışında, tek seferde yapıldı. Bu yüzden "tek adım = tek commit" kuralına uymuyor ve kod adları plandakilerden farklı olabilir. Prototipte Free/Pro kapıları, kota ve Supabase yoktur.

**Planda olmayan ekler:** ders grupları, AI ile çeviri (`translate-text`), yerel AI sunucusu, bağlantı yapıştırarak ders alma.

**Onay bekleyen:** L-004 fiyat senaryoları taslağı henüz commit edilmedi; L-005 bu onaydan sonra yapılır.

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


- [x] **L-001** · `docs: add unit economics framework`
  - **Ne:** `docs/UNIT_ECONOMICS.md` iskelet + Claude Haiku 5.5 fiyatları
  - **Neden:** COGS modeli prompt ve fiyattan önce çerçeve
  - **Doğrula:** Dosya var
- [x] **L-001b** · `docs: lock align system prompt v1`
  - **Ne:** `docs/SYSTEM_PROMPT.md` v3 — sabit sistem promptu, pairs JSON, scope (app boyar)
  - **Neden:** Token ölçümü ve Edge Function tek kaynak
  - **Doğrula:** Dosya kilitli
- [x] **L-001c** · `docs: add generate system prompt v1`
  - **Ne:** `docs/GENERATE_SYSTEM_PROMPT.md` v3 — yalnızca metin + çeviri (pairs yok)
  - **Neden:** Premium ders üretimi; eşleştirme ayrı `align-text` çağrısı
  - **Doğrula:** Dosya var
- [x] **L-001d** · `docs: add span mapping architecture`
  - **Ne:** `docs/SPAN_MAPPING.md` — MapPairsToSpans, palet, tap/TTS/drag
  - **Neden:** AI renk/konum döndürmez; uygulama sorumluluğu net
  - **Doğrula:** Dosya var
- [x] **L-001e** · `docs: add language pair hints`
  - **Ne:** `docs/LANGUAGE_PAIR_HINTS.md` — 12 dil + grammar_hints injection
  - **Neden:** Global uygulama; dinamik dil çifti
  - **Doğrula:** Dosya var
- [x] **L-002** · `docs: benchmark ai token usage`
  - **Ne:** `claude-haiku-5-5` ile generate ve align ayrı ölç (`UNIT_ECONOMICS.md` §4.1)
  - **Neden:** Tahmin değil ölçüm; cap ve fiyat buradan
  - **Doğrula:** Tablo dolu, COGS + doğrulama oranı yazılı
- [ ] 🟡 **L-003** · `docs: compute pro ai monthly caps`
  - **Ne:** Free 1/gün, Pro/Lifetime aylık cap — Haiku 5.5 COGS ile (thinking token'ları dahil)
  - **Neden:** Sınırsız AI yok; Lifetime aylık cap zorunlu
  - **Doğrula:** Cap rakamları yazılı
  - **Durum:** Limitler taslak; fiyat onayıyla L-005'te kilitlenecek
- [ ] **L-004** · `docs: compute pricing scenarios`
  - **Ne:** 3 senaryo + break-even; store %30
  - **Neden:** Fiyat onaysız configure edilmez
  - **Doğrula:** Sen onayladın mı?
- [ ] **L-005** · `docs: lock billing constants`
  - **Ne:** `docs/BILLING_CONSTANTS.md` (L-020’de TS’ye taşınır)
  - **Neden:** Onaylı cap/fiyat placeholder tek dosya
  - **Doğrula:** Dosya var


> **Kapı:** L-001b–e bitmeden L-002’ye geçme. L-004 onayı olmadan L-222+ (RevenueCat fiyat) yok.

---

## Faz 0 — Boş repo ve monorepo iskeleti


- [x] **L-010** · `chore: init git repository`
  - **Ne:** Boş `Lang/`, `git init`, `README.md` (1 paragraf: LinguaLink ne yapar)
  - **Neden:** Versiyon kontrolü ve GitHub private repo’nun temeli
  - **Doğrula:** `git status` temiz
- [x] **L-011** · `chore: add gitignore and nvmrc`
  - **Ne:** `.gitignore`, `.nvmrc` (24.16.0), `.npmrc` (engine-strict)
  - **Neden:** Node sürüm tutarlılığı; `.env` ve build artifact’ları repoya girmez
  - **Doğrula:** Dosyalar var
- [x] **L-012** · `chore: add root package.json and pnpm workspace`
  - **Ne:** Root `package.json`, `pnpm-workspace.yaml` (`apps/*`, `packages/*`, `supabase`)
  - **Neden:** Monorepo ile mobile + contracts + edge functions aynı repoda
  - **Doğrula:** `pnpm --version` OK
- [x] **L-013** · `chore: add tsconfig base`
  - **Ne:** `tsconfig.base.json` — strict, `noUncheckedIndexedAccess`
  - **Neden:** TypeScript 6 strict; runtime hatalarını compile-time yakalar
  - **Doğrula:** —
- [x] **L-014** · `chore: add env example template`
  - **Ne:** `.env.example` — Supabase, `ANTHROPIC_API_KEY` (yorum: yalnızca edge), RevenueCat placeholder
  - **Neden:** Hangi secret’ın nereye gittiğini öğrenirsin; client’a API key gitmez
  - **Doğrula:** `.env` gitignore’da
- [x] **L-015** · `chore: add hexagonal folder convention doc`
  - **Ne:** `docs/ARCHITECTURE.md` — bounded context listesi + klasör şablonu
  - **Neden:** Her feature aynı yapıda; SOLID ihlalini erken görürsün
  - **Doğrula:** Dosya okunabilir
- [x] **L-016** · `chore: add agents and cursor rules skeleton`
  - **Ne:** `AGENTS.md`, `.cursor/rules/hexagonal.mdc`, `.cursor/rules/solid.mdc`
  - **Neden:** AI-assisted yazımda katman sınırları korunur
  - **Doğrula:** Dosyalar var


---

## Faz 1 — Paylaşılan sözleşmeler (`packages/contracts`)


- [x] **L-020** · `feat(contracts): scaffold package`
  - **Ne:** `packages/contracts/package.json`, `tsconfig.json`, `src/index.ts`
  - **Neden:** Mobil ve Edge Function aynı Zod şemalarını paylaşır — tip uyumsuzluğu önlenir
  - **Doğrula:** `pnpm --filter @lingualink/contracts typecheck`
- [x] **L-021** · `feat(contracts): add LanguageCode enum`
  - **Ne:** 12 dil: en, tr, es, de, fr, it, pt, ja, ko, ar, zh, ru
  - **Neden:** Hedef ve ana dil aynı listeden seçilir (ürün kuralı)
  - **Doğrula:** typecheck
- [x] **L-022** · `feat(contracts): add AlignmentPair schema`
  - **Ne:** `order`, `source`, `target` — AI çıktısı; renk yok
  - **Neden:** Flat pair list; AlignmentTree kaldırıldı
  - **Doğrula:** typecheck
- [x] **L-023** · `feat(contracts): add AlignmentPairList schema`
  - **Ne:** `pairs: AlignmentPair[]` + `HIGHLIGHT_PALETTE` sabiti
  - **Neden:** Edge → mobil parse; renk uygulama atar
  - **Doğrula:** typecheck
- [x] **L-024** · `feat(contracts): add Lesson and MappedPair schemas`
  - **Ne:** `Lesson`, `TextSpan`, `MappedPair` (start/end/color)
  - **Neden:** SQLite + span mapping sonucu
  - **Doğrula:** typecheck
- [x] **L-025** · `feat(contracts): add TestQuestion schema`
  - **Ne:** `type: word | sentence | paragraph`, `prompt`, `choices`, `correctIndex`
  - **Neden:** Test modları contract-first tanımlanır
  - **Doğrula:** typecheck
- [x] **L-026** · `feat(contracts): add EntitlementTier schema`
  - **Ne:** `free | pro | lifetime`
  - **Neden:** Free/Pro storage ve feature gate tek tip
  - **Doğrula:** typecheck
- [x] **L-027** · `feat(contracts): export public API`
  - **Ne:** `src/index.ts` re-export
  - **Neden:** Diğer paketler tek import path
  - **Doğrula:** import edilebilir


---

## Faz 2 — Windows Android ortamı + Expo tracer


- [ ] 🟡 **L-028** · `docs: document windows android dev setup`
  - **Ne:** `docs/DEV_SETUP_WINDOWS.md` — Android Studio, SDK 36, AVD, `ANDROID_HOME`, `JAVA_HOME`; repo `C:\dev\lang` gibi kısa, ASCII bir yolda
  - **Neden:** Windows 11’de tekrarlanabilir kurulum; `Arşiv` gibi ASCII olmayan ve uzun yollar native build'i bozabilir
  - **Doğrula:** `adb devices` emülatör görünür
  - **Durum:** Kurulum README'de; `docs/DEV_SETUP_WINDOWS.md` yazılmadı
- [x] **L-029** · `chore: verify android emulator smoke`
  - **Ne:** Boş Expo yokken: `adb shell getprop ro.build.version.release`
  - **Neden:** Emülatör çalışıyor mu commit zincirine girmeden önce doğrulanır
  - **Doğrula:** API 36 cevap
- [x] **L-030** · `feat(mobile): scaffold expo sdk 58 app`
  - **Ne:** `npx create-expo-app@latest --template default@sdk-58` → `apps/mobile`, TypeScript
  - **Neden:** Çalışan en ince mobil iskelet; tracer bullet emülatörde doğrulanır
  - **Doğrula:** `npx expo start` → `a` ile Android
- [x] **L-031** · `feat(mobile): add expo router entry`
  - **Ne:** `app/_layout.tsx`, `app/index.tsx` — “LinguaLink” başlık
  - **Neden:** File-based routing tüm ekranların omurgası
  - **Doğrula:** **Android emülatörde** açılır
- [x] **L-032** · `feat(mobile): add workspace dependency to contracts`
  - **Ne:** `apps/mobile` → `@lingualink/contracts` workspace link
  - **Neden:** Monorepo tip paylaşımı mobilde çalışıyor mu erken test
  - **Doğrula:** typecheck mobile
- [ ] **L-033** · `chore(mobile): add eas.json development profile`
  - **Ne:** `eas.json` — development + preview profilleri
  - **Neden:** RevenueCat ve sqlite native modüller Expo Go’da tam çalışmaz; dev build şart
  - **Doğrula:** dosya var
- [ ] 🟡 **L-034** · `docs: document expo android dev client on windows`
  - **Ne:** README: `npx expo run:android` (birincil); iOS = EAS cloud only
  - **Neden:** Windows’ta yerel iOS yok; yanlış beklenti önlenir
  - **Doğrula:** README okunabilir
  - **Durum:** README'de Android komutları var; iOS notu eksik
- [x] **L-035** · `chore(mobile): first android dev build`
  - **Ne:** `npx expo run:android` — development client emülatöre yüklensin
  - **Neden:** Sonraki tüm native modül adımları bu build ile test edilir
  - **Doğrula:** uygulama emülatörde açılır


> **Tracer bullet #0:** Android emülatörde uygulama açılıyor.

---

## Faz 3 — Hexagonal iskelet + domain çekirdeği (`lessons` context)


- [x] **L-040** · `feat(lessons): add domain folder skeleton`
  - **Ne:** `src/features/lessons/{domain,application,infrastructure,presentation}`
  - **Neden:** Hexagonal şablon; her yeni feature kopyalanır
  - **Doğrula:** klasörler var
- [ ] 🟡 **L-041** · `test(lessons): add Lesson entity tests`
  - **Ne:** `Lesson.spec.ts` — boş başlık fail, geçerli lesson pass
  - **Neden:** Test-first domain; entity kuralları net
  - **Doğrula:** test FAIL
  - **Durum:** Entity sınıfı yok; kurallar `LessonSchema` ve `createLesson` içinde
- [ ] 🟡 **L-042** · `feat(lessons): implement Lesson entity`
  - **Ne:** `domain/entities/Lesson.ts`
  - **Neden:** İş kuralı UI’dan izole
  - **Doğrula:** test PASS
  - **Durum:** Entity sınıfı yok; kurallar `LessonSchema` ve `createLesson` içinde
- [ ] 🟡 **L-043** · `feat(lessons): add LanguageCode value object`
  - **Ne:** `domain/value-objects/LanguageCode.ts` — contracts’tan validate
  - **Neden:** Geçersiz dil kodu domain’e sızmaz
  - **Doğrula:** test PASS
  - **Durum:** Ayrı value object yok; `LanguageCodeSchema` kullanılıyor
- [ ] 🟡 **L-044** · `feat(lessons): define ILessonReader port`
  - **Ne:** `domain/ports/ILessonReader.ts`
  - **Neden:** Interface segregation — okuma ayrı port
  - **Doğrula:** typecheck
  - **Durum:** Okuma ve yazma tek `ILessonRepository` portunda
- [ ] 🟡 **L-045** · `feat(lessons): define ILessonWriter port`
  - **Ne:** `domain/ports/ILessonWriter.ts`
  - **Neden:** Yazma ayrı port; Liskov için küçük kontrat
  - **Doğrula:** typecheck
  - **Durum:** Okuma ve yazma tek `ILessonRepository` portunda
- [ ] 🟡 **L-046** · `test(lessons): add SaveLessonUseCase tests`
  - **Ne:** mock reader/writer ile spec
  - **Neden:** Use case davranışı adapter’dan bağımsız test edilir
  - **Doğrula:** test FAIL
  - **Durum:** `create-lesson.spec.ts` var; red aşaması görülmeden yazıldı
- [ ] 🟡 **L-047** · `feat(lessons): implement SaveLessonUseCase`
  - **Ne:** `application/SaveLessonUseCase.ts`
  - **Neden:** Tek sorumluluk: ders kaydetme orchestration
  - **Doğrula:** test PASS
  - **Durum:** `createLesson` fonksiyonu olarak yapıldı
- [x] **L-048** · `feat(lessons): add InMemoryLessonRepository`
  - **Ne:** test adapter — Map tabanlı
  - **Neden:** SQLite gelmeden use case’leri çalıştırırsın (hızlı tracer)
  - **Doğrula:** test PASS


---

## Faz 4 — Dil registry (12 dil, hedef = ana dil)


- [ ] 🟡 **L-050** · `feat(languages): add domain LanguageRegistry`
  - **Ne:** `features/languages/domain/LanguageRegistry.ts` — 12 dil meta (kod, native ad, RTL flag)
  - **Neden:** Onboarding ve ders oluşturma aynı listeyi kullanır
  - **Doğrula:** unit test
  - **Durum:** `shared/languages.ts` var; RTL bilgisi ve registry yok
- [ ] **L-051** · `feat(languages): add GetLanguagesUseCase`
  - **Ne:** liste döndür
  - **Neden:** Presentation domain’e doğrudan erişmez
  - **Doğrula:** test PASS
- [ ] 🟡 **L-052** · `feat(languages): add LanguagePicker component`
  - **Ne:** `presentation/LanguagePicker.tsx` — flat list
  - **Neden:** Kullanıcı hedef ve ana dili seçebilir
  - **Doğrula:** Android emülatörde liste
  - **Durum:** Genel `ChipRow` kullanılıyor; `LanguagePicker` yok
- [ ] **L-053** · `feat(languages): persist selected langs in async storage`
  - **Ne:** `IUserPreferencesPort` + adapter
  - **Neden:** Seçimler uygulama restart’ta kalır
  - **Doğrula:** restart sonrası seçili


---

## Faz 5 — SQLite offline depolama (Free tier temeli)


- [ ] 🟡 **L-060** · `feat(mobile): install expo-sqlite and drizzle`
  - **Ne:** `npx expo install expo-sqlite`, drizzle-orm
  - **Neden:** Free kullanıcı dersleri yalnızca cihazda — offline-first ürün kuralı
  - **Doğrula:** install OK
  - **Durum:** expo-sqlite kurulu; drizzle kullanılmadı
- [x] **L-061** · `feat(lessons): add sqlite schema`
  - **Ne:** `lessons`, `alignment_pairs` — order, phrases, span index, color
  - **Neden:** Düz pair listesi + map sonucu index’ler
  - **Doğrula:** migration çalışır
- [x] **L-062** · `feat(lessons): add SqliteLessonReader adapter`
  - **Ne:** `ILessonReader` impl
  - **Neden:** Free tier’ın birincil depolama adaptörü
  - **Doğrula:** read test PASS
- [x] **L-063** · `feat(lessons): add SqliteLessonWriter adapter`
  - **Ne:** `ILessonWriter` impl
  - **Neden:** Kayıt offline; sunucu maliyeti sıfır
  - **Doğrula:** write + read roundtrip
- [x] **L-064** · `feat(lessons): wire SaveLessonUseCase to sqlite`
  - **Ne:** composition root / DI module
  - **Neden:** Tracer: emülatörde kalıcı kayıt (dev build gerekir)
  - **Doğrula:** ders DB’de
- [ ] **L-065** · `feat(lessons): add free tier max 2 active lessons rule`
  - **Ne:** domain `LessonQuotaPolicy`
  - **Neden:** Free limit ürün kararı; domain’de enforce
  - **Doğrula:** 3. ders reddedilir


---

## Faz 6 — Ders editörü tracer (yapıştır → hazırla)


- [ ] **L-070** · `feat(lessons): add PrepareTextsUseCase`
  - **Ne:** ham metin → `LessonDraft` (sourceText, targetText)
  - **Neden:** “Metinleri Hazırla” butonunun iş kuralı UI’dan ayrılır
  - **Doğrula:** unit test
- [x] **L-071** · `feat(lessons): add CreateLessonScreen shell`
  - **Ne:** `app/(tabs)/create.tsx` — iki TextInput + buton
  - **Neden:** Kullanıcı akışının ana giriş ekranı
  - **Doğrula:** Android emülatör
- [ ] **L-072** · `feat(lessons): wire prepare button to use case`
  - **Ne:** state: draft göster
  - **Neden:** Tracer: yapıştır → hazırla → alt kutuda metin
  - **Doğrula:** metin görünür
- [x] **L-073** · `feat(lessons): add interactive text renderer`
  - **Ne:** token span listesi (henüz renk yok)
  - **Neden:** Manuel seçim için tıklanabilir kelime/kelime grupları gerekir
  - **Doğrula:** tıklanır span


---

## Faz 7 — Manuel eşleştirme (renkli highlight)


- [x] **L-080** · `feat(alignment): add ManualMatchUseCase`
  - **Ne:** seçili source span + target span → segment çifti
  - **Neden:** AI olmadan eşleştirme mümkün; pedagojik kontrol
  - **Doğrula:** unit test
- [ ] 🟡 **L-081** · `feat(alignment): add segment selection state hook`
  - **Ne:** `useSegmentSelection.ts`
  - **Neden:** Presentation’da selection logic izole
  - **Doğrula:** iki span seçilir
  - **Durum:** Seçim durumu `PairWorkspace` içinde; ayrı hook yok
- [x] **L-082** · `feat(alignment): add color index per match`
  - **Ne:** `ColorIndex` value object, döngüsel palet
  - **Neden:** Görsel 1’deki gibi farklı renkler öğrenmeyi kolaylaştırır
  - **Doğrula:** renkler görünür
- [ ] 🟡 **L-083** · `feat(alignment): add Match button and pair list`
  - **Ne:** “Seçili İfadeleri Eşleştir”
  - **Neden:** Kullanıcı adım adım eşleşme oluşturur
  - **Doğrula:** çift listelenir
  - **Durum:** Eşleştir düğmesi var; ayrı çift listesi yok
- [ ] **L-084** · `feat(alignment): add clear selection buttons`
  - **Ne:** İngilizce/Türkçe seçimi temizle
  - **Neden:** Yanlış seçim düzeltmesi
  - **Doğrula:** temizlenir
- [x] **L-085** · `feat(lessons): save lesson with segments`
  - **Ne:** SaveLesson + segment persist
  - **Neden:** Tracer bullet #1: manuel ders kaydı uçtan uca
  - **Doğrula:** SQLite’da ders


> **Tracer bullet #1:** Yapıştır → hazırla → manuel eşleştir → kaydet.

---

## Faz 8 — Kayıtlı dersler listesi


- [ ] 🟡 **L-090** · `feat(lessons): add ListLessonsUseCase`
  - **Ne:** tüm dersleri listele
  - **Neden:** Lessons ekranı use case üzerinden
  - **Doğrula:** test PASS
  - **Durum:** Ekran doğrudan repository çağırıyor; use case yok
- [x] **L-091** · `feat(lessons): add LessonsScreen`
  - **Ne:** `app/(tabs)/lessons.tsx` — kart listesi, tarih
  - **Neden:** Kayıtlı derslere tekrar erişim
  - **Doğrula:** kayıtlı ders görünür
- [ ] 🟡 **L-092** · `feat(lessons): add LoadLessonUseCase`
  - **Ne:** tek ders + alignment_pairs
  - **Neden:** Düzenleme ve test için yükleme
  - **Doğrula:** edit açılır
  - **Durum:** Ekran doğrudan repository çağırıyor; use case yok
- [ ] 🟡 **L-093** · `feat(lessons): add DeleteLessonUseCase`
  - **Ne:** soft veya hard delete
  - **Neden:** Kullanıcı ders yönetimi
  - **Doğrula:** silince listeden düşer
  - **Durum:** Ekran doğrudan repository çağırıyor; use case yok
- [x] **L-094** · `feat(lessons): add bottom tabs navigator`
  - **Ne:** create + lessons tab
  - **Neden:** Ana navigasyon iskeleti
  - **Doğrula:** tab geçişi


---

## Faz 9 — Supabase yerel proje


- [ ] **L-100** · `chore(supabase): init local project`
  - **Ne:** `supabase init`, `config.toml`
  - **Neden:** Pro tier cloud storage ve paylaşım için backend
  - **Doğrula:** `supabase start`
- [ ] **L-101** · `feat(supabase): add profiles migration`
  - **Ne:** `profiles` — `tier`, `ui_locale`
  - **Neden:** Kullanıcı tier bilgisi RLS ile korunur
  - **Doğrula:** Studio’da tablo
- [ ] **L-102** · `feat(supabase): add lessons cloud migration`
  - **Ne:** `lessons`, `alignment_pairs` cloud mirror
  - **Neden:** Pro online depolama şeması
  - **Doğrula:** migration apply
- [ ] **L-103** · `feat(supabase): enable RLS owner policies`
  - **Ne:** `auth.uid() = user_id`
  - **Neden:** Başka kullanıcının dersine erişim engeli
  - **Doğrula:** policy test
- [ ] **L-104** · `feat(supabase): add shared_decks migration`
  - **Ne:** `share_slug`, `payload jsonb`
  - **Neden:** Deep link paylaşım veri modeli
  - **Doğrula:** tablo var
- [ ] **L-105** · `feat(supabase): add ai_usage migration`
  - **Ne:** günlük/aylık alignment + generation sayacı
  - **Neden:** Free 1/gün ve Pro cap sunucuda enforce
  - **Doğrula:** tablo var


---

## Faz 10 — Auth (Supabase)


- [ ] **L-110** · `feat(mobile): add supabase client adapter`
  - **Ne:** `infrastructure/SupabaseClient.ts` — anon key only
  - **Neden:** Auth ve Pro sync için client; service key mobilde yok
  - **Doğrula:** bağlantı OK
- [ ] **L-111** · `feat(auth): add IAuthService port`
  - **Ne:** signIn, signUp, signOut, session
  - **Neden:** Domain auth soyutlaması
  - **Doğrula:** typecheck
- [ ] **L-112** · `feat(auth): add AuthScreen`
  - **Ne:** email + password + Apple (sonra)
  - **Neden:** Pro tier ve paylaşım için kullanıcı kimliği
  - **Doğrula:** giriş yapılır
- [ ] **L-113** · `feat(auth): add session gate in root layout`
  - **Ne:** oturum yoksa Supabase anonim oturum
  - **Neden:** Free kullanıcı kayıtsız başlar ama AI kotası için `user_id` gerekir; Pro için hesaba yükseltilir
  - **Doğrula:** anonim oturumda kota sayılır


---

## Faz 11 — Pro online depolama + tier routing


- [ ] **L-120** · `feat(lessons): add SupabaseLessonReader`
  - **Ne:** cloud read adapter
  - **Neden:** Pro kullanıcı dersleri cloud’da
  - **Doğrula:** read OK
- [ ] **L-121** · `feat(lessons): add SupabaseLessonWriter`
  - **Ne:** cloud write adapter
  - **Neden:** Free offline / Pro online ürün kuralı
  - **Doğrula:** write OK
- [ ] **L-122** · `feat(billing): add IEntitlementService port`
  - **Ne:** `getTier(): EntitlementTier`
  - **Neden:** Storage routing tek yerden
  - **Doğrula:** mock test
- [ ] **L-123** · `feat(lessons): add StorageRouter`
  - **Ne:** tier’a göre sqlite veya supabase
  - **Neden:** Open/Closed: yeni adapter eklemek use case değiştirmez
  - **Doğrula:** free→sqlite, pro→cloud
- [ ] **L-124** · `feat(lessons): add MigrateLocalToCloudUseCase`
  - **Ne:** Pro’ya geçişte tek seferlik taşıma
  - **Neden:** Kullanıcı veri kaybı yaşamaz
  - **Doğrula:** migrate sonrası cloud’da
- [ ] **L-125** · `test(lessons): storage router integration tests`
  - **Ne:** tier mock ile iki adapter
  - **Neden:** Liskov: her iki repo aynı kontratı karşılar
  - **Doğrula:** tests PASS


---

## Faz 12 — AI alignment: stub + span boyama


- [x] **L-130** · `feat(alignment): define IAlignmentService port`
  - **Ne:** `align(...): AlignmentPairList`
  - **Neden:** AI sağlayıcı değişse use case değişmez
  - **Doğrula:** typecheck
- [x] **L-131** · `feat(alignment): add MapPairsToSpansUseCase`
  - **Ne:** pairs → MappedPair[] + palet + coverage validate
  - **Neden:** Boyama AI’da değil uygulamada (`SPAN_MAPPING.md`)
  - **Doğrula:** unit test PASS
- [x] **L-132** · `feat(alignment): add HighlightText component`
  - **Ne:** üst hedef / alt ana dil kutusu, renkli span
  - **Neden:** Kullanıcı eşleşmeyi görür
  - **Doğrula:** Android emülatör
- [x] **L-133** · `feat(alignment): add tap sync between boxes`
  - **Ne:** tık → karşı span highlight
  - **Neden:** Öğrenme: ilişkiyi görmek
  - **Doğrula:** iki kutu sync
- [ ] 🟡 **L-134** · `feat(alignment): add SpeakPairUseCase`
  - **Ne:** tık → expo-speech hedef dil
  - **Neden:** Otomatik telaffuz
  - **Doğrula:** ses duyulur
  - **Durum:** `speak` çağrılıyor ve ses motoruna ulaşıyor; ses kulakla doğrulanmadı, use case yok
- [ ] **L-135** · `feat(supabase): add align-text edge function skeleton`
  - **Ne:** CORS + auth + stub pairs JSON
  - **Neden:** API key sunucuda
  - **Doğrula:** functions serve
- [ ] **L-136** · `feat(alignment): add StubAlignmentAdapter`
  - **Ne:** sabit pairs[] örnek (young boy cümlesi)
  - **Neden:** Gerçek AI öncesi uçtan uca pipeline
  - **Doğrula:** renkli boyama
- [ ] 🟡 **L-137** · `feat(alignment): add AlignTextUseCase`
  - **Ne:** port + MapPairsToSpans zinciri
  - **Neden:** Application orchestration
  - **Doğrula:** unit test
  - **Durum:** Zincir ekranda kurulu; ayrı use case yok
- [x] **L-138** · `feat(alignment): add AI Eşleştir button`
  - **Ne:** error + ~12 sn beklemeye uygun ilerleme göstergesi
  - **Neden:** Sihir anı UX; eşleştirme anlık değil
  - **Doğrula:** stub çalışır
- [ ] 🟡 **L-139** · `feat(alignment): add RealignPairUseCase mvp`
  - **Ne:** basılı tut + sürükle → pair düzelt
  - **Neden:** Yanlış AI eşleşmesi düzeltmesi
  - **Doğrula:** drag çalışır
  - **Durum:** Sürükleme yok; çift silip elle yeniden eşleştirme var


> **Tracer bullet #2:** Stub pairs → MapPairsToSpans → renkli UI + tap/TTS.

---

## Faz 13 — Prompt factory + gerçek Claude Haiku 5.5


- [ ] 🟡 **L-140** · `feat(prompts): add prompt template package`
  - **Ne:** `packages/prompts/` — sabit `ALIGN_SYSTEM_PROMPT` + `buildAlignmentUserMessage()`
  - **Neden:** Sistem promptu sabit, bağlam kullanıcı mesajında
  - **Doğrula:** unit test
  - **Durum:** `packages/prompts` yerine `packages/ai` içinde
- [x] **L-141** · `feat(prompts): add buildGrammarHints`
  - **Ne:** `LANGUAGE_PAIR_HINTS.md` → kod
  - **Neden:** 12 dil çifti desteği
  - **Doğrula:** en-tr test
- [ ] 🟡 **L-142** · `feat(prompts): wire GENERATE_SYSTEM_PROMPT`
  - **Ne:** sabit `GENERATE_SYSTEM_PROMPT` + `buildGenerateUserMessage()`
  - **Neden:** Premium ders üretimi
  - **Doğrula:** prompt string
  - **Durum:** `packages/ai` içinde
- [ ] 🟡 **L-143** · `feat(alignment): add ClaudeHaikuAdapter`
  - **Ne:** `claude-haiku-5-5`, `messages.parse` + `zodOutputFormat`, `effort: "low"`; `temperature` yok
  - **Neden:** Şema uyumlu çıktı + düşük COGS; sağlayıcı port arkasında
  - **Doğrula:** invoke OK
  - **Durum:** `messages.create` + JSON şeması ile; `messages.parse` kullanılmadı
- [x] **L-144** · `feat(alignment): add AlignmentValidator`
  - **Ne:** `ALIGN_VALIDATION.md` kuralları ve test matrisi
  - **Neden:** Şema kaplamayı garanti etmez; AI hatası uygulamaya sızmaz
  - **Doğrula:** invalid → 422
- [ ] 🟡 **L-145** · `feat(alignment): add sentence chunked alignment`
  - **Ne:** `splitIntoSentences` + cümle başına align + `order` birleştirme
  - **Neden:** Uzun metinde cümle kaymasını önler
  - **Doğrula:** 200 kelime testi geçer
  - **Durum:** Yalnızca yedek akış olarak var; 200 kelime testi yapılmadı
- [x] **L-146** · `feat(alignment): handle refusal and retry`
  - **Ne:** `stop_reason` kontrolü, 1 yeniden deneme, manuel moda düşüş
  - **Neden:** Haiku 5.5'te sunucu tarafı fallback yok
  - **Doğrula:** refusal → manuel mod
- [ ] 🟡 **L-147** · `feat(alignment): wire mobile to real edge function`
  - **Ne:** stub kaldır
  - **Neden:** Tracer bullet #3
  - **Doğrula:** Android: ilerleme göstergesi görünür, yanıt ~12 sn içinde gelir
  - **Durum:** Mobil gerçek modele bağlı, ama Edge Function yerine yerel sunucudan
- [ ] 🟡 **L-148** · `feat(alignment): add manual override after AI`
  - **Ne:** sürükle + manuel eşleştir
  - **Neden:** AI düzeltme
  - **Doğrula:** edit + re-save
  - **Durum:** Sürükleme yok; silme ve elle eşleştirme var


> **Tracer bullet #3:** Gerçek Claude Haiku 5.5 alignment.

---

## Faz 14 — AI kullanım limitleri (tier)


- [ ] **L-150** · `feat(usage): add CheckAiQuotaUseCase`
  - **Ne:** edge başında günlük/aylık sayaç
  - **Neden:** Sınırsız AI zararını sunucu durdurur
  - **Doğrula:** free 2. istek 429
- [ ] **L-151** · `feat(usage): increment ai_usage in edge`
  - **Ne:** başarılı alignment sonrası +1
  - **Neden:** COGS telemetry ve limit için kayıt
  - **Doğrula:** DB sayacı artar
- [ ] **L-152** · `feat(alignment): show paywall prompt on 429`
  - **Ne:** mobilde limit mesajı
  - **Neden:** Free → Pro dönüşüm fırsatı
  - **Doğrula:** mesaj görünür
- [ ] **L-153** · `feat(obs): log alignment duration and token estimate`
  - **Ne:** PostHog event iskeleti
  - **Neden:** Çağrı P95 ≤12 sn hedefi ve unit ekonomisi gerçek veri
  - **Doğrula:** event dashboard


---

## Faz 15 — Flashcards (ayrı menü)


- [ ] **L-160** · `feat(flashcards): add domain FlashcardCard entity`
  - **Ne:** front/back, pairOrder, lessonId
  - **Neden:** Flashcard domain ayrı context
  - **Doğrula:** unit test
- [ ] **L-161** · `feat(flashcards): add BuildDeckUseCase`
  - **Ne:** alignment_pairs’ten kart destesi
  - **Neden:** Kullanıcı kayıtlı dersten çalışır (Madde 7)
  - **Doğrula:** test PASS
- [ ] **L-162** · `feat(flashcards): add FlashcardsScreen tab`
  - **Ne:** `app/(tabs)/flashcards.tsx` — ayrı menü
  - **Neden:** Lessons’tan bağımsız tekrar modu
  - **Doğrula:** tab görünür
- [ ] **L-163** · `feat(flashcards): add card flip UI`
  - **Ne:** ön/hedef, arka/ana dil
  - **Neden:** Klasik flashcard deneyimi
  - **Doğrula:** flip çalışır
- [ ] **L-164** · `feat(flashcards): add know dont know actions`
  - **Ne:** shuffle, basit ilerleme
  - **Neden:** MVP SRS yok; random shuffle yeterli
  - **Doğrula:** deste ilerler
- [ ] **L-165** · `feat(flashcards): add lesson filter picker`
  - **Ne:** hangi derslerden kart
  - **Neden:** Çoklu ders destesi
  - **Doğrula:** filtre çalışır
- [ ] **L-166** · `feat(flashcards): add expo-speech TTS pro gate`
  - **Ne:** Pro’da İngilizce telaffuz
  - **Neden:** Free/Pro farkı; Pro değer artışı
  - **Doğrula:** Pro’da ses


---

## Faz 16 — Öğrenme testi: random (Free)


- [x] **L-170** · `feat(tests): add GenerateQuestionsUseCase`
  - **Ne:** segmentlerden MCQ üret
  - **Neden:** Test iş kuralı UI’dan izole
  - **Doğrula:** unit test
- [x] **L-171** · `feat(tests): add word level question generator`
  - **Ne:** kısa pair (≤3 kelime)
  - **Neden:** Kelime/kelime grubu soruları
  - **Doğrula:** soru üretilir
- [ ] 🟡 **L-172** · `feat(tests): add sentence level generator`
  - **Ne:** tam source_text / uzun pair
  - **Neden:** Cümle tipi sorular
  - **Doğrula:** soru üretilir
  - **Durum:** Uzun çiftlerden üretiliyor; tam `source_text` kullanılmıyor
- [ ] 🟡 **L-173** · `feat(tests): add paragraph level generator`
  - **Ne:** birleşik metin bloğu
  - **Neden:** Paragraf tipi sorular
  - **Doğrula:** soru üretilir
  - **Durum:** Uzun çiftlerden üretiliyor; birleşik metin bloğu yok
- [x] **L-174** · `feat(tests): add distractor picker`
  - **Ne:** aynı derslerden 3 yanlış şık
  - **Neden:** MCQ kalitesi
  - **Doğrula:** 4 şık unique
- [x] **L-175** · `feat(tests): add TestScreen random mode`
  - **Ne:** `app/(tabs)/test.tsx`
  - **Neden:** Free yalnızca random (Madde 6)
  - **Doğrula:** random başlar
- [x] **L-176** · `feat(tests): add answer feedback UI`
  - **Ne:** doğru yeşil / yanlış kırmızı + doğru cevap
  - **Neden:** Görsel 2 UX
  - **Doğrula:** feedback görünür
- [x] **L-177** · `feat(tests): add test session complete screen`
  - **Ne:** skor özeti
  - **Neden:** Tamamlanma hissi + review tetikleyici hazırlığı
  - **Doğrula:** skor görünür


---

## Faz 17 — Test: ders seçimi (Pro only)


- [ ] **L-180** · `feat(tests): add StartTestUseCase tier gate`
  - **Ne:** free → yalnız `random`
  - **Neden:** Ürün kuralı Madde 6
  - **Doğrula:** free’de select gizli
- [ ] 🟡 **L-181** · `feat(tests): add lesson multi-select UI`
  - **Ne:** checkbox ile 1+ ders
  - **Neden:** Pro kullanıcı hedefli çalışır
  - **Doğrula:** pro’da seçim
  - **Durum:** Çoklu ders seçimi var; Pro kapısı yok
- [ ] 🟡 **L-182** · `feat(tests): add mixed question type session`
  - **Ne:** word+sentence+paragraph karışık
  - **Neden:** Kapsamlı sınav deneyimi
  - **Doğrula:** karışık sorular
  - **Durum:** Türler uzunluğa göre karışıyor; ayrı oturum modu yok
- [ ] **L-183** · `feat(tests): persist TestResult locally`
  - **Ne:** skor geçmişi basit sayaç
  - **Neden:** “Tamamlanan test sayısı” metrik
  - **Doğrula:** sayaç artar


---

## Faz 18 — Paylaşım ve deep link


- [ ] **L-189** · `feat(sharing): add IShareService port`
  - **Ne:** bundle oluştur, slug al
  - **Neden:** Paylaşım altyapısı soyut
  - **Doğrula:** typecheck
- [ ] **L-190** · `feat(sharing): add ShareDecksUseCase`
  - **Ne:** 1+ ders → `shared_decks` insert
  - **Neden:** Viral loop temeli
  - **Doğrula:** slug döner
- [ ] **L-191** · `feat(sharing): add tier gate max 3 free max unlimited pro`
  - **Ne:** Free max 3 ders, Pro 4+
  - **Neden:** Madde 8 ürün kuralı
  - **Doğrula:** free 4. ders reddedilir
- [x] **L-192** · `feat(mobile): configure scheme lingualink`
  - **Ne:** `app.config.ts` scheme + intent filters
  - **Neden:** `lingualink://deck/xyz` deep link
  - **Doğrula:** link açılır
- [ ] 🟡 **L-193** · `feat(sharing): add ImportDeckUseCase`
  - **Ne:** deep link → local/cloud import
  - **Neden:** Alıcı paylaşılan dersi alır
  - **Doğrula:** import sonrası listede
  - **Durum:** Bağlantıdan alma çalışıyor; deck ve slug modeli yok
- [ ] 🟡 **L-194** · `feat(sharing): add share sheet button on lessons screen`
  - **Ne:** native share API
  - **Neden:** Tek tık paylaşım
  - **Doğrula:** share sheet açılır
  - **Durum:** Paylaşım ders ekranında; `shared_decks` kaydı yok
- [ ] 🟡 **L-195** · `feat(sharing): add deck shareId route`
  - **Ne:** `app/deck/[shareId].tsx`
  - **Neden:** Universal link giriş noktası
  - **Doğrula:** cold start import
  - **Durum:** `/import` rotası çalan uygulamada denendi; `deck/[shareId]` ve soğuk açılış yok


---

## Faz 19 — Premium AI ders üretimi


- [ ] 🟡 **L-200** · `feat(prompts): add buildLessonGenerationPrompt`
  - **Ne:** topic + langs + difficulty
  - **Neden:** Kullanıcı kendi cümlesini bulmak zorunda değil (Madde 11)
  - **Doğrula:** prompt test
  - **Durum:** Üretim mesajı `packages/ai` içinde
- [ ] 🟡 **L-201** · `feat(supabase): add generate-lesson edge function`
  - **Ne:** yalnızca source_text + target_text; ardından `align-text`
  - **Neden:** Premium ders üretimi (`GENERATE_SYSTEM_PROMPT.md`); benchmark tek geçişin bozulduğunu gösterdi
  - **Doğrula:** invoke OK
  - **Durum:** Yerel sunucuda; Edge Function yok
- [ ] 🟡 **L-202** · `feat(lessons): add GenerateLessonUseCase`
  - **Ne:** Pro gate + quota
  - **Neden:** Free bu özelliği kullanamaz
  - **Doğrula:** free blocked
  - **Durum:** Üretim çalışıyor; Pro kapısı ve kota yok
- [ ] 🟡 **L-203** · `feat(lessons): add topic input and generate button UI`
  - **Ne:** create ekranında Pro bölümü
  - **Neden:** UX: konu gir → ders hazır
  - **Doğrula:** pro’da ders oluşur
  - **Durum:** Konu girişi Oluştur ekranında; Pro kapısı yok


---

## Faz 20 — Onboarding + i18n (EN, TR, ES UI)


- [ ] **L-210** · `feat(i18n): setup i18next`
  - **Ne:** `src/i18n/`, `en.json`, `tr.json`, `es.json`
  - **Neden:** Lansman UI dilleri (plandaki 3 dil)
  - **Doğrula:** dil değişir
- [ ] **L-211** · `feat(onboarding): add onboarding flow screens`
  - **Ne:** hedef dil, ana dil, günlük hedef
  - **Neden:** Kişiselleştirme + paywall öncesi bağlam
  - **Doğrula:** akış tamamlanır
- [ ] **L-212** · `feat(onboarding): add plan preparing animation`
  - **Ne:** 2-3sn loading animasyonu
  - **Neden:** Paywall öncesi algılanan değer (lansman boost)
  - **Doğrula:** animasyon görünür
- [ ] **L-213** · `feat(onboarding): persist onboarding complete flag`
  - **Ne:** bir kez göster
  - **Neden:** Tekrarlayan onboarding churn yaratır
  - **Doğrula:** ikinci açılış atlanır


---

## Faz 21 — RevenueCat + Paywall


- [ ] **L-220** · `feat(mobile): install react-native-purchases`
  - **Ne:** `npx expo install react-native-purchases react-native-purchases-ui`
  - **Neden:** IAP Expo SDK 58 resmi yolu; dev build gerekir
  - **Doğrula:** dev build OK
- [ ] **L-221** · `feat(billing): add RevenueCatEntitlementAdapter`
  - **Ne:** `IEntitlementService` impl
  - **Neden:** Gerçek tier RevenueCat’ten gelir
  - **Doğrula:** sandbox tier
- [ ] **L-222** · `feat(billing): configure products from UNIT_ECONOMICS`
  - **Ne:** monthly, yearly, lifetime product ids
  - **Neden:** Onaylı fiyatlar dışında configure yok (L-004 kapısı)
  - **Doğrula:** products match doc
- [ ] **L-223** · `feat(billing): add PaywallScreen`
  - **Ne:** onboarding sonunda RevenueCat UI
  - **Neden:** Anında paywall lansman geliri
  - **Doğrula:** paywall görünür
- [ ] **L-224** · `feat(billing): wire StorageRouter to live entitlement`
  - **Ne:** satın alma sonrası cloud’a geç
  - **Neden:** Pro satın alınca online depolama aktif
  - **Doğrula:** pro→supabase


---

## Faz 22 — Review prompt + konfeti


- [ ] **L-230** · `feat(mobile): install expo-store-review`
  - **Ne:** native review API
  - **Neden:** İlk 5 yıldız ASO boost (plandaki tetikleyici)
  - **Doğrula:** paket OK
- [ ] **L-231** · `feat(growth): add ReviewPromptUseCase`
  - **Ne:** ilk ders kaydı + test %100 koşulu
  - **Neden:** Dopamin anında puanlama istemi
  - **Doğrula:** koşul sağlanınca tetik
- [ ] **L-232** · `feat(growth): add confetti on perfect test`
  - **Ne:** görsel kutlama
  - **Neden:** Review prompt ile eşzamanlı pozitif duygu
  - **Doğrula:** konfeti + review


---

## Faz 23 — Marketplace


- [ ] **L-240** · `feat(supabase): add market_listings migration`
  - **Ne:** title, payload, price_cents, seller_id
  - **Neden:** Ders paylaş/sat altyapısı (Madde 12)
  - **Doğrula:** tablo var
- [ ] **L-241** · `feat(marketplace): add ListListingsUseCase`
  - **Ne:** ücretsiz + ücretli liste
  - **Neden:** Keşif ekranı
  - **Doğrula:** listeler gelir
- [ ] **L-242** · `feat(marketplace): add PublishListingUseCase`
  - **Ne:** ücretsiz herkes, satış Pro
  - **Neden:** Creator monetization Pro’ya özel
  - **Doğrula:** free satış blocked
- [ ] **L-243** · `feat(marketplace): add MarketScreen tab`
  - **Ne:** `app/(tabs)/market.tsx`
  - **Neden:** Ayrı market menüsü
  - **Doğrula:** tab açılır
- [ ] **L-244** · `feat(marketplace): add purchase flow stub`
  - **Ne:** price>0 → RevenueCat veya IAP consumable TBD
  - **Neden:** Satış tamamlama — payout modeli sonra
  - **Doğrula:** stub flow
- [ ] **L-245** · `feat(marketplace): add download listing to lessons`
  - **Ne:** import bundle
  - **Neden:** Alıcı marketten ders alır
  - **Doğrula:** ders import


---

## Faz 24 — Observability


- [ ] **L-250** · `feat(obs): integrate sentry react native`
  - **Ne:** crash capture
  - **Neden:** Store kalite sinyali crash-free sessions
  - **Doğrula:** test crash
- [ ] **L-251** · `feat(obs): integrate posthog`
  - **Ne:** funnel events listesi (plandaki)
  - **Neden:** D1/D3, paywall CVR, AI sihir anı ölçümü
  - **Doğrula:** dashboard event
- [ ] **L-252** · `feat(obs): add ai cost telemetry events`
  - **Ne:** token estimate per user per action
  - **Neden:** Unit ekonomisi gerçek veriyle güncellenir
  - **Doğrula:** event gelir


---

## Faz 25 — EAS Build + Store Submit


- [ ] **L-260** · `chore(eas): add production build profile`
  - **Ne:** Android + iOS (iOS = EAS cloud, Windows’ta yerel build yok)
  - **Neden:** Store’a giden binary
  - **Doğrula:** `eas build -p android` OK
- [ ] **L-261** · `docs: add privacy policy and terms urls`
  - **Ne:** AI/Anthropic, veri saklama, KVKK; metin AI'a gönderilmeden önce uygulama içi açık onay
  - **Neden:** Store zorunlu metadata
  - **Doğrula:** URL’ler canlı
- [ ] **L-262** · `chore(store): play console listing tr en es`
  - **Ne:** screenshot (emülatörden), açıklama, ASO
  - **Neden:** Windows geliştirmede **Android önce** lansman
  - **Doğrula:** listing draft
- [ ] **L-263** · `chore(store): play internal testing submit`
  - **Ne:** Android beta
  - **Neden:** Geliştirme boyunca kullandığın yüzeyde son doğrulama
  - **Doğrula:** internal OK
- [ ] **L-264** · `chore(eas): ios build via eas cloud`
  - **Ne:** `eas build -p ios` — Mac gerekmez
  - **Neden:** Windows’tan iOS binary yalnızca EAS ile
  - **Doğrula:** .ipa artifact
- [ ] **L-265** · `chore(store): app store connect metadata`
  - **Ne:** screenshot, açıklama (iOS boyutları)
  - **Neden:** iOS lansman ikinci dalga veya paralel
  - **Doğrula:** metadata draft
- [ ] **L-266** · `chore(eas): testflight internal submit`
  - **Ne:** iOS beta (EAS Submit)
  - **Neden:** iOS gerçek cihaz doğrulaması
  - **Doğrula:** TestFlight OK
- [ ] **L-267** · `feat(mobile): add app links android intent filters`
  - **Ne:** `lingualink.app` + Android App Links
  - **Neden:** HTTPS deep link (Windows’ta emülatörde test)
  - **Doğrula:** `adb` link test
- [ ] **L-268** · `feat: tag mvp-store-v1`
  - **Ne:** git tag
  - **Neden:** Lansman snapshot
  - **Doğrula:** tag var


> **Tracer bullet #4 (MVP Store):** Play Internal (Windows’ta doğrulanmış) → ardından EAS iOS + TestFlight.

---

## Faz 26 — MVP sonrası cilalama (nihai hedef tamamlayıcı)


- [ ] **L-270** · `feat(lessons): add export json pro gate`
  - **Ne:** ders bundle .json
  - **Neden:** Pro değer: yedekleme/ taşıma
  - **Doğrula:** export dosyası
- [ ] **L-271** · `feat(lessons): add export anki format pro gate`
  - **Ne:** Anki uyumlu
  - **Neden:** Anki kitlesi Lifetime hedefi
  - **Doğrula:** anki import edilir
- [ ] **L-272** · `feat(tests): add srs spaced repetition v2`
  - **Ne:** flashcard + test SRS
  - **Neden:** Uzun vadeli retention artışı
  - **Doğrula:** SRS çalışır
- [ ] **L-273** · `feat(auth): add sign in with google and apple`
  - **Ne:** Google (Android önce test); Apple (iOS build sonrası)
  - **Neden:** Play Store Google login yaygın; Apple iOS guideline
  - **Doğrula:** Google emülatörde OK
- [ ] **L-274** · `feat(marketplace): add creator payout stripe connect`
  - **Ne:** satış geliri payı
  - **Neden:** Marketplace sürdürülebilir gelir
  - **Doğrula:** payout test
- [ ] **L-275** · `feat: tag feature-complete-v1`
  - **Ne:** git tag
  - **Neden:** Nihai plan hedefi tamamlandı
  - **Doğrula:** tag var


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
