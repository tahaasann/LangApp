# LinguaLink Lite — Unit Ekonomisi

> **Durum:** Prompt v3 (L-001b–e). L-002 ölçüm bekliyor (Haiku 5.5, generate ve align ayrı). L-003–L-005 henüz tamamlanmadı.
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

**Dikkat:** Haiku 5.5'te thinking varsayılan olarak açıktır ve çıktı token'ı olarak faturalanır. `effort: "low"` kullanılır; ölçüm `usage.output_tokens` üzerinden yapılır.

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

> **L-002:** `claude-haiku-5-5` + kilitli system prompt ile ölçülecek. Gemini sonuçları (`BENCHMARK_ANALYSIS.md`) bu modele aktarılamaz.

| İşlem | Örnek | Input token | Output token | COGS USD | Doğrulama | Kaynak |
|-------|-------|-------------|--------------|----------|-----------|--------|
| Alignment (kısa) | 1 cümle ~20 kelime | TBD | TBD | TBD | TBD | L-002 ölçüm |
| Alignment (paragraf) | ~80 kelime, cümle parçalı | TBD | TBD | TBD | TBD | L-002 ölçüm |
| Alignment (uzun) | ~200 kelime, cümle parçalı | TBD | TBD | TBD | TBD | L-002 ölçüm |
| Lesson generation | konu → yalnızca metin | TBD | TBD | TBD | — | L-002 ölçüm |

### 4.1 L-002 ölçüm prosedürü

1. Model **`claude-haiku-5-5`**, `output_config.effort: "low"`, structured output
2. System: `docs/SYSTEM_PROMPT.md`; generate için `docs/GENERATE_SYSTEM_PROMPT.md`
3. User JSON: dil, seviye, `grammar_hints`, `source_text`, `target_text` (sabit metinler; örnekler aşağıda)
4. `usage.input_tokens` ve `usage.output_tokens` kaydet; `stop_reason` ve `AlignmentValidator` sonucunu not et
5. COGS = formül §2
6. Her örneği 5 kez çalıştır; maliyetle birlikte doğrulama geçme oranını yaz
7. Aynı metinleri `gpt-6-luna` ile de çalıştır. Haiku belirgin biçimde geride kalırsa model kararı yeniden açılır

**Örnek paragraf (benchmark #2):**

- Source (EN): `Today is the happiest day of my life because today is so beautiful.`
- Target (TR): `Bugün hayatımın en mutlu günü çünkü bugün çok güzel.`

**Beginner uzun cümle (benchmark #3):**

- "Although the young boy tried extremely hard..." çifti — `docs/SYSTEM_PROMPT.md` fine granularity testi; sabit çift sayısı beklenmez, kaplama ve anlam ölçülür

---

## 5. Tier AI limitleri (L-003 doldurur)

| Tier | Alignment | Generation | Not |
|------|-----------|------------|-----|
| Free | TBD/gün | 0 | |
| Pro | TBD/ay | TBD/ay | Cap ölçüm sonrası belirlenir |
| Lifetime | TBD/ay | TBD/ay | Aylık cap zorunlu |

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
| 2026-11-05 | AI model: `claude-haiku-5-5` $0.10/$0.50 (`gemini-3.1-flash-lite` yerine); L-002 kalite ölçümüne bağlı | Kullanıcı isteği; seçenekler Haiku 5.5 / GPT-6 Luna |
| 2026-11-05 | Prompt v3: sabit sistem promptu, bağlam kullanıcı mesajında | Mimari güncelleme |
