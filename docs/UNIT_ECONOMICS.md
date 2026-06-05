# LinguaLink Lite — Unit Ekonomisi

> **Durum:** PROMPT v1 kilitli (L-001b–e). L-002 ölçüm bekliyor (SYSTEM_PROMPT.md ile). L-003–L-005 henüz tamamlanmadı.
> **Son güncelleme:** 2026-06-05
> **AI model (COGS baz):** `gemini-3.1-flash-lite` — **$0.25/M input**, **$1.50/M output**

---

## 1. Amaç

Free / Pro / Lifetime katmanlarında:

- AI istek başına **COGS** (maliyet)
- Kullanıcı başına aylık AI tavanı
- Store komisyonu sonrası **net gelir** ve break-even

… hesaplanmadan **store fiyatı configure edilmez**.

**Ön koşul:** Token benchmark (L-002) yalnızca `docs/SYSTEM_PROMPT.md` + `docs/GENERATE_SYSTEM_PROMPT.md` kilitlendikten sonra yapılır.

---

## 2. Gemini API birim fiyatları (kilitli)

| Kalem | USD / 1M token |
|-------|----------------|
| Input (text) | **$0.25** |
| Output | **$1.50** |

Kaynak: kullanıcı onayı + [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) (Gemini 3.1 Flash-Lite tier).

**Formül (tek istek):**

```text
COGS_usd = (input_tokens / 1_000_000) × 0.25 + (output_tokens / 1_000_000) × 1.50
```

**Karşılaştırma (eski tahmin modeli):** `gemini-2.5-flash` ($0.30 / $2.50) → 3.1 Flash-Lite **~%17 daha ucuz input, %40 daha ucuz output** — cap'ler yeniden ölçümle güncellenir.

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
| **AI ders üretimi** | `generate-lesson` | `GENERATE_SYSTEM_PROMPT.md` | Pro / Lifetime |

---

## 4. Token benchmark tablosu

> **L-002:** `gemini-3.1-flash-lite` + kilitli system prompt ile ölçülecek. Aşağıdaki tahminler **geçersiz** — yalnızca placeholder.

| İşlem | Örnek | Input token | Output token | COGS USD | Kaynak |
|-------|-------|-------------|--------------|----------|--------|
| Alignment (kısa) | 1 cümle ~20 kelime | TBD | TBD | TBD | L-002 ölçüm |
| Alignment (paragraf) | ~80 kelime, beginner fine | TBD | TBD | TBD | L-002 ölçüm |
| Alignment (uzun) | ~200 kelime | TBD | TBD | TBD | L-002 ölçüm |
| Lesson generation | konu + tam JSON | TBD | TBD | TBD | L-002 ölçüm |

### 4.1 L-002 ölçüm prosedürü

1. [Google AI Studio](https://aistudio.google.com/) → model **`gemini-3.1-flash-lite`**
2. System: `docs/SYSTEM_PROMPT.md` içeriği + örnek injection (en/tr, beginner, fine)
3. User JSON: `source_text` + `target_text` (paragraf örneği aşağıda)
4. `usageMetadata` → `promptTokenCount`, `candidatesTokenCount` kaydet
5. COGS = formül §2

**Örnek paragraf (benchmark #2):**

- Source (EN): `Today is the happiest day of my life because today is so beautiful.`
- Target (TR): `Bugün hayatımın en mutlu günü çünkü bugün çok güzel.`

**Beginner uzun cümle (benchmark #3 — 22 pair beklenir):**

- "Although the young boy tried extremely hard..." çifti — `docs/SYSTEM_PROMPT.md` fine granularity testi

---

## 5. Tier AI limitleri (L-003 doldurur)

| Tier | Alignment | Generation | Not |
|------|-----------|------------|-----|
| Free | TBD/gün | 0 | |
| Pro | TBD/ay | TBD/ay | Flash-Lite ile cap artırılabilir — ölçüm sonrası |
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
