# LinguaLink Lite — Unit Ekonomisi

> **Durum:** Prompt v3 (L-001b–e). L-002 Haiku 5.5 için ölçüldü (§4). L-003–L-005 henüz tamamlanmadı.
> **Son güncelleme:** 2026-11-05
> **AI model (COGS baz):** `claude-haiku-5-5` — **$0.10/M input**, **$0.50/M output**

---

## 1. Amaç

Free / Pro / Lifetime katmanlarında:

- AI istek başına **COGS** (maliyet)
- Kullanıcı başına aylık AI tavanı
- Store komisyonu sonrası **net gelir** ve break-even

… hesaplanmadan **store fiyatı configure edilmez**.

**Ön koşul:** Token benchmark (L-002) yalnızca `docs/SYSTEM_PROMPT.md` + `docs/GENERATE_SYSTEM_PROMPT.md` kilitlendikten sonra yapılır.

---

## 2. Claude API birim fiyatları

| Kalem | USD / 1M token |
|-------|----------------|
| Input (≤100K token prompt) | **$0.10** |
| Output (thinking dahil) | **$0.50** |
| Cache okuma | ~$0.01 |
| Cache yazma (5 dk) | ~$0.125 |

Kaynak: [Claude API pricing](https://platform.claude.com/docs/en/about-claude/pricing). Prompt 100K token'ı aşarsa $0.50 / $2.50 uygulanır; bu üründe beklenmez.

**Formül (tek istek, önbelleksiz):**

```text
COGS_usd = (input_tokens / 1_000_000) × 0.10 + (output_tokens / 1_000_000) × 0.50
```

**Dikkat:** Haiku 5.5'te thinking varsayılan olarak açıktır ve çıktı token'ı olarak faturalanır. `effort: "low"` ile bile çıktı token'larının çoğu thinking'dir (kısa cümlede ~1460 token; aynı metin thinking kapalıyken ~140).

**Önbellek:** Sistem promptu sabit tutulduğu için hazırdır, ama varsayılan olarak kapalıdır. En az 512 token önek gerekir ve 5 dakikalık pencerede en az 2 istek olmadan yazma maliyeti çıkmaz. L-002 ölçümü ve gerçek trafik sonrası değerlendirilir.

**Karşılaştırma:** `gemini-3.1-flash-lite` ($0.25 / $1.50) → Haiku 5.5 **%60 daha ucuz input, ~%67 daha ucuz output**. `gpt-6-luna` liste fiyatı aynıdır ($0.10 / $0.50, cache okuma $0.01). Seçim kalite ölçümüyle doğrulanır (§4.1).

**Sabit maliyetler (kullanıcı başına tahmini — L-004’te netleşir):**

| Kalem | Free | Pro |
|-------|------|-----|
| Supabase | $0 | ~$0.05–0.15/ay |
| Edge Function invoke | ~$0 | ~$0.01–0.03/ay |
| RevenueCat | $0 | ~%1 gelir veya sabit minimum |

---

## 3. İşlem tipleri

| İşlem | Endpoint | Prompt dosyası | Kim kullanır |
|-------|----------|----------------|--------------|
| **Phrase alignment** | `align-text` | `SYSTEM_PROMPT.md` | Free (limitli), Pro |
| **AI ders üretimi** | `generate-lesson` | `GENERATE_SYSTEM_PROMPT.md` (yalnızca metin; `pairs` yok) | Pro / Lifetime |

---

## 4. Token benchmark tablosu

> **L-002 (2026-11-05):** `claude-haiku-5-5`, `effort: "low"`, thinking açık, 5 tur. Maliyet ve token, işlem başına ortalamadır. Doğrulama boşluk toleranslıdır. Ham veri: `docs/benchmarks/`. Gemini sonuçları (`BENCHMARK_ANALYSIS.md`) bu modele aktarılamaz.

| İşlem | Örnek | İstek | Input token | Output token | COGS USD | Doğrulama | Çağrı P95 |
|-------|-------|-------|-------------|--------------|----------|-----------|-----------|
| Alignment (kısa) | en-tr, 13 kelime | 1 | 2213 | 1464 | $0.00095 | 5/5 | 7.3 sn |
| Alignment (kısa) | ja-en | 1 | 2021 | 1896 | $0.00115 | 5/5 | 13.7 sn |
| Alignment (kısa) | de-es | 1 | 2064 | 1053 | $0.00073 | 3/5 | 5.9 sn |
| Alignment (paragraf) | en-tr, ~60 kelime, tek istek | 1 | 2417 | 2492 | $0.00149 | 5/5 | 11.7 sn |
| Alignment (paragraf) | aynı metin, cümle parçalı | 6 | 13213 | 7342 | $0.00499 | 5/5 | 9.5 sn |
| Alignment (uzun) | en-tr, ~130 kelime, tek istek | 1 | 2831 | 3826 | $0.00220 | 4/5 | 19.3 sn |
| Alignment (uzun) | aynı metin, cümle parçalı | 8 | 17937 | 13807 | $0.00870 | 5/5 | 12.2 sn |
| Lesson generation | konu → yalnızca metin | 1 | ~1250 | ~300 | $0.00025 | — | 2.7 sn |

**Bulgular**

- **Kalite:** Çağrı bazında 100 çağrının 97'si doğrulamadan geçti. Elle yalnızca örnek çıktılar incelendi; bunlarda cümle kayması görülmedi, ama tüm çıktıların anlamı kontrol edilmedi.
- **Thinking kapalı:** Maliyet ~%70 düşer ve çağrı P95 2.6 sn olur, ama 100 çağrının yalnızca 24'ü geçer (noktalama sayılmasa 74). Boş `pairs` ve metinde olmayan hedefler de görüldü. Kullanılmaz.
- **Gecikme:** Thinking açıkken çağrı P95 ~12 sn; önceki `<3 sn` hedefi bu ayarla tutmadığı için hedef **çağrı P95 ≤12 sn** oldu ve ekranda ilerleme gösterilir. Sonuç ders başına bir kez üretilip kaydedildiğinden bekleme çalışma sırasında tekrarlanmaz. Ölçüm yalnızca model çağrısını kapsar: mobil ve Edge Function ağı, yeniden denemeler ve parçalı isteklerin toplam süresi buna dahil değildir. ~130 kelimelik tek istek 19 sn'ye çıkabilir. Gerçek süre L-153 ile izlenir.
- **Cümle parçalama:** Maliyeti 3–4 katına çıkarır. Bu örneklemde tek istek de neredeyse aynı oranda geçti; öneri, önce tek istek gönderip yalnızca doğrulama başarısız olursa parçalamaktır. 5 tur bu kararı kesinleştirmek için azdır.
- **Toplam ölçüm maliyeti:** ~$0.17.

### 4.1 L-002 ölçüm prosedürü

1. Model **`claude-haiku-5-5`**, `output_config.effort: "low"`, structured output
2. System: `docs/SYSTEM_PROMPT.md`; generate için `docs/GENERATE_SYSTEM_PROMPT.md`
3. User JSON: dil, seviye, `grammar_hints`, `source_text`, `target_text` (sabit metinler; örnekler aşağıda)
4. `usage.input_tokens` ve `usage.output_tokens` kaydet; `stop_reason` ve `AlignmentValidator` sonucunu not et
5. COGS = formül §2
6. Her örneği 5 kez çalıştır; maliyetle birlikte doğrulama geçme oranını yaz
7. Komut: `node --env-file=.env packages/benchmark/src/run.ts 5 adaptive`

**Örnek paragraf (benchmark #2):**

- Source (EN): `Today is the happiest day of my life because today is so beautiful.`
- Target (TR): `Bugün hayatımın en mutlu günü çünkü bugün çok güzel.`

**Beginner uzun cümle (benchmark #3):**

- "Although the young boy tried extremely hard..." çifti — `docs/SYSTEM_PROMPT.md` fine granularity testi; sabit çift sayısı beklenmez, kaplama ve anlam ölçülür

---

## 5. Tier AI limitleri (L-003)

> **Durum:** Taslak. Fiyat senaryosuyla birlikte onaylanınca L-005'te kilitlenir.

**Planlama birim maliyetleri (§4'ten):**

| Kalem | USD | Dayanak |
|-------|-----|---------|
| Eşleştirme, planlama | $0.0025 | ~130 kelimelik tek istek ($0.0022) + yeniden deneme payı |
| Eşleştirme, en kötü durum | $0.016 | 200 kelime: tek istek başarısız, ardından cümle parçalı. Ölçülmedi, §4'ten orantılandı |
| Ders üretimi (yalnızca metin) | $0.00025 | Ölçüm |

**Önerilen limitler:**

| Tier | Eşleştirme | Üretim | Limitte AI maliyeti/ay | En kötü durum/ay |
|------|------------|--------|------------------------|------------------|
| Free | 1/gün | 0 | $0.08 | $0.48 |
| Pro | 200/ay | 50/ay | $0.51 | $3.21 |
| Lifetime | 100/ay | 20/ay | $0.26 | $1.61 |

**Sayım kuralları:**

- Üretilen ders eşleştirileceği için iki sayaçtan da birer düşer.
- Otomatik yeniden deneme ve parçalı yedek istek kotadan düşmez (`ALIGN_VALIDATION.md` §3). Kullanıcının aynı metni yeniden eşleştirmesi düşer.
- Metin uzunluğu sunucuda sınırlanır: istek başına en fazla **1.500 karakter** `source_text` (İngilizcede ~200 kelime). Sınır yoksa maliyetin üst sınırı da olmaz. Japonca gibi dillerde karakter başına token daha yüksek olduğundan sınır L-145'te ölçülerek doğrulanır.
- Gerekçe: 200/ay günde ~6 ders eder; günlük çalışan kullanıcı için yeterli varsayılır, gerçek kullanım L-153 ile izlenir.

**Riskler:**

- **Free maliyeti ödeyen kullanıcıya biner:** En büyük belirsizlik budur (§7'deki duyarlılık tablosu).
- **Anonim oturum kötüye kullanımı:** Uygulamayı yeniden kurmak yeni anonim kimlik, dolayısıyla yeni Free kotası verebilir. Faz 14'te IP hız sınırı ve cihaz doğrulaması (App Attest / Play Integrity) değerlendirilir.

---

## 6. Fiyat senaryoları (L-004 — onay gerekir)

| Senaryo | Liste fiyatı | Store net (~%30) | Durum |
|---------|--------------|------------------|-------|
| Pro aylık | TBD | TBD | ONAY BEKLİYOR |
| Pro yıllık | TBD | TBD | ONAY BEKLİYOR |
| Lifetime | TBD | TBD | ONAY BEKLİYOR |
| Lansman indirimi | TBD % | — | ONAY BEKLİYOR |

---

## 7. Break-even (L-004 doldurur)

```text
net_per_sub_usd = list_price × (1 - store_fee_rate)
gross_margin_usd = net_per_sub_usd - ai_cogs_heavy_user - infra_per_user
break_even_paying_users = monthly_fixed_costs / gross_margin_usd
```

**Sabit maliyetler (aylık):** TBD

---

## 8. Karar günlüğü

| Tarih | Karar | Onaylayan |
|-------|-------|-----------|
| 2026-06-05 | AI model: `gemini-3.1-flash-lite` $0.25/$1.50 | Kullanıcı |
| 2026-06-05 | Alignment: flat `pairs[]` + app-side span mapping | Kullanıcı |
| 2026-06-05 | Renk: uygulama paleti, AI döndürmez | Kullanıcı |
| 2026-06-05 | Prompt v1: SYSTEM + GENERATE + SPAN_MAPPING | L-001b–e |
| 2026-06-05 | Generate ve align ayrı çağrılar; sunucu doğrulaması | Benchmark analizi |
| 2026-11-05 | AI model: `claude-haiku-5-5` $0.10/$0.50 (`gemini-3.1-flash-lite` yerine); GPT-6 Luna ile karşılaştırılmadı | Kullanıcı |
| 2026-11-05 | Thinking açık, `effort: "low"`; boşluk toleranslı doğrulama | L-002 ölçümü |
| 2026-11-05 | Prompt v3: sabit sistem promptu, bağlam kullanıcı mesajında | Mimari güncelleme |
| 2026-11-05 | Eşleştirme gecikme hedefi: çağrı P95 ≤12 sn + ilerleme göstergesi (`<3 sn` yerine) | Kullanıcı |
