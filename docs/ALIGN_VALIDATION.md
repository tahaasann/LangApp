# LinguaLink — Eşleştirme Doğrulama ve Pipeline

> **Sorumluluk:** Modelin döndürdüğü `pairs[]`, kullanıcıya ulaşmadan önce sunucuda `AlignmentValidator` ile doğrulanır.  
> **Neden:** Haziran 2026 benchmark'ında uzun metinde cümle kayması ve metinde olmayan hedefler görüldü (`BENCHMARK_ANALYSIS.md`). Şema uyumu tek başına anlam veya kaplama doğruluğu garantisi vermez.

---

## 1. Akış

```text
source_text + target_text
        │
        ▼
splitIntoSentences (uygulama kodu)
        │  ≤ 40 kelime: tek istek · daha uzun: cümle çifti başına istek
        ▼
align-text → claude-haiku-5-5
        │
        ▼
AlignmentValidator ── geçersiz → 1 yeniden deneme → 422 + manuel mod
        │ geçerli
        ▼
order birleştirme → MapPairsToSpans → Highlight + TTS
```

Cümle sayıları iki metinde eşit değilse parçalama atlanır, metin tek istekte gönderilir.

## 2. Kurallar

| # | Kural | Hata kodu |
|---|-------|-----------|
| 1 | `order` değerleri 0..n-1 ve ardışık | `ORDER_INVALID` |
| 2 | `source` ve `target` boş değil, yalnızca boşluk değil | `EMPTY_PHRASE` |
| 3 | Her `source`, `source_text` içinde alt dizgi | `SOURCE_NOT_FOUND` |
| 4 | Her `target`, `target_text` içinde alt dizgi | `TARGET_NOT_FOUND` |
| 5 | Kaynak parçaları sırayla birleşince `source_text`'in tamamını verir | `SOURCE_COVERAGE` |
| 6 | Hedef parçaları örtüşmeden yerleşir ve `target_text`'in tamamını kaplar | `TARGET_COVERAGE` |

Kural 6 için aynı metin birden çok kez geçebilir: her `target`, henüz kullanılmamış bir konuma yerleştirilir. Yerleştirme bulunamazsa sonuç geçersizdir.

Parçalar arasındaki boşluk ve noktalamada `SOURCE_COVERAGE` ve `TARGET_COVERAGE` katıdır; model birebir kaplamayı tutturamıyorsa L-002 ölçümünde gevşetme (yalnızca boşluk farkına izin) ayrıca değerlendirilir.

## 3. Model yanıtı işleme

Doğrulamadan önce Edge Function şunları kontrol eder:

| Durum | Davranış |
|-------|----------|
| `stop_reason: "refusal"` | Yeniden deneme yok; manuel mod. Haiku 5.5'te sunucu tarafı fallback yok |
| `stop_reason: "max_tokens"` | `max_tokens` yükseltilerek 1 yeniden deneme |
| 429 / 5xx | SDK yeniden denemesi (varsayılan 2) |
| Doğrulama hatası | Hata kodları kullanıcı mesajına eklenerek 1 yeniden deneme |

Kurallar:

- Yanıt içeriği `type` alanına göre okunur; ilk blok `thinking` olabilir.
- `temperature` gönderilmez: Haiku 5.5 varsayılan dışı örnekleme değerlerini 400 ile reddeder.
- Yeniden denemeler de kullanım kotasına değil, COGS telemetrisine yazılır; kota yalnızca başarılı sonuçta artar.

## 4. Test matrisi (L-144)

- Geçerli çift (en-tr, kaplama tam)
- Hayalet hedef: `"—"`
- Tekrarlı ifade: "bugün ... bugün" iki ayrı konuma yerleşir
- Aynı konuma iki `target` (cümle kayması belirtisi)
- Eksik kaplama: son parça dönmemiş
- Hedef sırası kaynak sırasından farklı (geçerli)
