# LinguaLink Lite — Unit Ekonomisi

> **Durum:** TASLAK — L-001 iskelet. L-002 ölçüm, L-003 cap, L-004 fiyat senaryoları, L-005 kilit sabitler.
> **Son güncelleme:** 2026-06-05
> **AI model (COGS baz):** `gemini-2.5-flash` (plan: Gemini 3.5 Flash — fiyat doğrulanınca güncelle)

---

## 1. Amaç

Free / Pro / Lifetime katmanlarında:

- AI istek başına **COGS** (maliyet)
- Kullanıcı başına aylık AI tavanı
- Store komisyonu sonrası **net gelir** ve break-even

… hesaplanmadan **store fiyatı configure edilmez**.

---

## 2. Gemini API birim fiyatları (referans)

Kaynak: [Google Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) — Mayıs/Haziran 2026.

| Kalem | USD / 1M token |
|-------|----------------|
| Input (text/image/video) | $0.30 |
| Output (thinking dahil) | $2.50 |

**Formül (tek istek):**
```text
COGS_usd = (input_tokens / 1_000_000) × 0.30 + (output_tokens / 1_000_000) × 2.50
```


**Sabit maliyetler (kullanıcı başına tahmini — L-004’te netleşir):**

| Kalem | Free | Pro |
|-------|------|-----|
| Supabase | $0 | ~$0.05–0.15/ay (aktif kullanıcı) |
| Edge Function invoke | ~$0 | ~$0.01–0.03/ay |
| RevenueCat | $0 | ~%1 gelir veya sabit minimum |

---

## 3. İşlem tipleri

| İşlem | Endpoint | Kim kullanır |
|-------|----------|--------------|
| **Hiyerarşik alignment** | `align-text` | Free (limitli), Pro |
| **AI ders üretimi** | `generate-lesson` | Yalnızca Pro/Lifetime |

---

## 4. Token benchmark tablosu (L-002 doldurur)

| İşlem | Örnek | Input token | Output token | COGS USD | Ölçüm tarihi |
|-------|-------|-------------|--------------|----------|--------------|
| Alignment (kısa cümle) | TBD | TBD | TBD | TBD | — |
| Alignment (paragraf) | TBD | TBD | TBD | TBD | — |
| Lesson generation | TBD | TBD | TBD | TBD | — |

---

## 5. Tier AI limitleri (L-003 doldurur)

| Tier | Alignment | Generation | Not |
|------|-----------|------------|-----|
| Free | TBD/gün | 0 | |
| Pro | TBD/ay | TBD/ay | Pazarlama “cömert”; gerçek sınırsız değil |
| Lifetime | TBD | TBD | Aboneliksiz sürekli maliyet riski |

---

## 6. Fiyat senaryoları (L-004 — onay gerekir)

| Senaryo | Liste fiyatı | Yıllık eşdeğer | Store net (~%30) | Durum |
|---------|--------------|----------------|------------------|-------|
| Pro aylık | TBD | — | TBD | ONAY BEKLİYOR |
| Pro yıllık | TBD | — | TBD | ONAY BEKLİYOR |
| Lifetime | TBD | tek sefer | TBD | ONAY BEKLİYOR |
| Lansman indirimi | TBD % | — | — | ONAY BEKLİYOR |

---

## 7. Break-even (L-004 doldurur)
```text
net_per_sub_usd = list_price × (1 - store_fee_rate) gross_margin_usd = net_per_sub_usd - ai_cogs_heavy_user - infra_per_user break_even_paying_users = monthly_fixed_costs / gross_margin_usd
```


**Sabit maliyetler (aylık):** TBD (Apple $99/yıl, Google $25 tek sefer, Supabase plan, domain)

---

## 8. Karar günlüğü

| Tarih | Karar | Onaylayan |
|-------|-------|-----------|
| — | — | — |