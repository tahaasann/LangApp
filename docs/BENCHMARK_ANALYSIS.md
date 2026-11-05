# LinguaLink — Benchmark Analizi ve Mimari Öneriler

> **Tarih:** 2026-06-05  
> **Ham veri:** `c:\Users\tahaa\Desktop\token_counter\benchmark_results.md`  
> **Test script:** `c:\Users\tahaa\Desktop\token_counter\benchmark_test.py`  
> **Model (ölçüm):** `gemini-3.1-flash-lite`  
> **Kalite analizi (ikinci görüş):** Gemini 3.5 Flash  
> **Yazar:** Cursor agent — LinguaLink mimari değerlendirmesi

---

## 0. Yönetici özeti

| Soru | Cevap |
|------|--------|
| Token/COGS ölçümü güvenilir mi? | **Evet** — `usageMetadata` ve fiyat formülü tutarlı |
| Çıktı kalitesi üretime hazır mı? | **Hayır** — Senaryo 1 ve 3 ciddi hatalı; Senaryo 2 kabul edilebilir |
| Sorun yalnızca “kötü prompt” mu? | **Hayır** — Test metodolojisi ve mimari yük asıl sorun |
| Flash-Lite tek başına yeterli mi? | **Hayır** — Özellikle uzun metin + üç iş bir arada (üret/çevir/eşleştir) |
| Ne yapmalıyız? | **Ayrı pipeline**, **sunucu doğrulama**, **cümle-parça hizalama**, **model yönlendirme** |

**En kritik bulgu:** Bu benchmark aslında `docs/SYSTEM_PROMPT.md` (yalnızca align) dosyasını değil, `docs/GENERATE_SYSTEM_PROMPT.md` mantığındaki **tek geçişte metin üretimi + çeviri + pairs** işini test etmiştir. Script `SYSTEM_PROMPT_TEMPLATE` içinde “Lesson Generator” ve `source_text`/`target_text`/`pairs` üçlüsünü istiyor. Dolayısıyla “alignment prompt facia” sonucunun bir kısmı **yanlış prompt dosyası** ve **aşırı görev yükü** kaynaklıdır — ama bu, canlıda da yaşanacak gerçek bir riski ortaya çıkarmıştır.

---

## 1. Test metodolojisi — ne ölçüldü, ne ölçülmedi?

### 1.1 Script’in gerçekte yaptığı

`benchmark_test.py` şunları yapıyor:

1. **System:** Generate Lesson prompt (üçlü JSON: `source_text`, `target_text`, `pairs`)
2. **User:** “Generate a sentence/paragraph about X”
3. **Model:** `gemini-3.1-flash-lite`
4. **Format:** `response_mime_type: application/json`

Bu, plandaki **`align-text`** endpoint’inden farklıdır. `align-text` şöyle olmalı:

- System: `SYSTEM_PROMPT.md` (yalnızca `pairs`)
- User: `{ "source_text": "...", "target_text": "..." }` — metinler **önceden var**

### 1.2 Sonuç: iki ayrı benchmark gerekir

| Benchmark | Amaç | System prompt | User input |
|-----------|------|---------------|------------|
| **A — Generate** | Premium “tek tık ders” | `GENERATE_SYSTEM_PROMPT.md` | topic + level |
| **B — Align** | Kullanıcı yapıştırdı / generate sonrası 2. adım | `SYSTEM_PROMPT.md` | hazır iki metin |

**L-002 henüz tamamlanmış sayılmaz** — önce B tipi (sabit metinlerle) align benchmark’i şart.

### 1.3 Input token’ların ~500 sabit kalması

Üç senaryoda da input ~499–508 token. Sebep: system prompt + kısa user prompt ağırlıklı; **üretilen metin input’a girmiyor**. Bu, **align-only** testinde (uzun metinler user message’da) input token’ların ciddi artacağı anlamına gelir — COGS tablosu yeniden ölçülmeli.

---

## 2. COGS tablosu (ölçülen — generate+align birleşik)

Fiyat: **$0.25/M input**, **$1.50/M output**

| Senaryo | EN/TR kelime | Input | Output | COGS USD | Pairs |
|---------|--------------|-------|--------|----------|-------|
| 1 — Kısa | 17 / 15 | 499 | 311 | **$0.000591** | 10 |
| 2 — Paragraf | 80 / 61 | 505 | 616 | **$0.001050** | 10 |
| 3 — Uzun | 180 / 162 | 508 | 1457 | **$0.002313** | 9 |

**Gözlemler:**

- Output token Senaryo 3’te patlıyor (1457) — uzun metin + çok pair JSON maliyeti
- Senaryo 3’te yalnızca **9 pair** üretilmiş ama **8 cümle** var — `advanced/coarse` granülarite + model zayıflığı = **cümle kayması**
- Birleşik işlem başına maliyet düşük görünse de **kalitesiz çıktı = sıfır kullanıcı değeri**

**İki aşamalı pipeline tahmini (kabaca):**

- Generate (Lite): ~$0.0003–0.0008
- Align (Lite veya daha güçlü model): ~$0.0005–0.003
- Toplam hâlâ Pro kullanıcı başına aylık cap içinde yönetilebilir — **ama align adımı için kalite şart**

---

## 3. Senaryo bazlı kalite analizi

### 3.1 Senaryo 1 (Kısa — beginner/fine) — BAŞARISIZ

**Yapısal hatalar:**

| # | Hata | Detay |
|---|------|-------|
| A1 | `"I"` → `"—"` | `—` metinde yok; full coverage ihlali; yasak karakter uydurma |
| A2 | Pro-drop | Türkçe’de özne fiil ekinde (`-um`); `I` ayrı pair olmamalı |
| A3 | Sıra / anlam | `"for here"` ↔ `"Burada içmek için"` — konum doğru ama `"I would like to order"` ile birleşmeliydi |

**MapPairsToSpans sonucu:** `"—"` `indexOf` ile bulunamaz → **SpanMappingError** → uygulama kırılır.

**Gemini 3.5 Flash analizi:** Doğru — A hatası onaylandı.

**Kök neden:** Fine granularity + Lite model + pro-drop dil çifti kuralı prompt’ta yok + generate ile aynı anda alignment.

---

### 3.2 Senaryo 2 (Paragraf — intermediate/medium) — BAŞARILI (göreli)

**Olumlu:**

- 10 pair, 6 cümlelik paragraf — medium granülarite mantıklı
- `"I would like to check in"` ↔ `"giriş yapmak istiyorum"` — pro-drop doğru gruplanmış
- `"for my reservation under the name John Smith."` ↔ `"John Smith ismiyle yaptığım rezervasyon için"` — kelime sırası farkı iyi yönetilmiş
- Tam metin substring’leri genelde gerçek metinden

**Küçük riskler (manuel kontrol gerekir):**

- Noktalama pair sınırlarında (`John Smith.` vs `pasaportum.`)
- `MapPairsToSpans` tam kaplama doğrulaması çalıştırılmalı — gözle iyi görünse de otomatik test şart

**Sonuç:** Bu senaryo, **doğru pipeline + orta granülarite** ile Lite’ın sınıra yakın çalışabileceğini gösteriyor. “Sihir anı” için iyi aday uzunluk: **~60–100 kelime, cümle bazlı medium pairs**.

---

### 3.3 Senaryo 3 (Uzun — advanced/coarse) — FELAKET

**Yapısal hatalar (Gemini 3.5 Flash ile örtüşen):**

| # | Hata | Kanıt |
|---|------|-------|
| B1 | Zincirleme cümle kayması | `order 1` EN cümle 2 ↔ TR cümle 3; sonraki tüm order’lar kayık |
| B2 | `order 0` şişirme | TR tarafında fiilen iki cümlelik içerik tek pair’e tıkıştırılmış |
| B3 | Duplicate target | `order 7` ve `order 8` aynı TR cümleye eşlenmiş |
| B4 | Eksik coverage | 8 EN cümle, 9 pair ama anlamsal eşleşme son cümlelerde çökmüş |

**Kullanıcı etkisi:** Test/flashcard modunda **%100 yanlış öğretim** — retention değil, güven kaybı.

**Kök nedenler:**

1. **Coarse granülarite + çok cümle** — model “cümle başına bir pair” yapamayınca kayıyor
2. **Tek geçişte 180 kelime üret + çevir + 9 pair JSON** — Lite için bilişsel yük aşımı
3. **Uzun akademik EN ↔ TR** — devrik yan cümle, tireli clause; hizalama NP-hard’a yakın

**Gemini 3.5 Flash analizi:** B ve C hataları tam isabet. “Coarse yasak” önerisi uzun metinler için doğru.

---

## 4. Gemini 3.5 Flash önerileri — değerlendirmem

| Öneri | Katılıyor muyum? | LinguaLink’e uyarlama |
|-------|------------------|------------------------|
| **Two-pass pipeline** | **Evet — zorunlu** | Generate (Lite) → Align (ayrı çağrı, ayrı prompt) |
| **Pro-drop rule** | **Evet** | `SYSTEM_PROMPT.md` + `LANGUAGE_PAIR_HINTS.md` tr/en için |
| **Coarse yasak (uzun metin)** | **Evet** | `max_sentences` veya kelime > N → minimum `medium` |
| **Daha güçlü model align için** | **Kısmen** | Önce cümle-parça + Lite; yeterli değilse `gemini-2.5-flash` veya 3.5 Flash align-only |
| **1.5 Pro / GPT-4o-mini** | **Maliyetli** | Cap hesabı sonrası; MVP’de sentence-chunk + validation önce |

**Ek önerilerim (3.5 Flash’ın yazmadığı):**

1. **Sunucu tarafı `AlignmentValidator`** — deploy öncesi zorunlu
2. **Cümle sınırlarında chunk align** — paragrafı önce böl, her cümleyi ayrı align, sonra `order` birleştir
3. **`—` ve boş target yasak** — regex + 422
4. **Duplicate target span dedektörü** — aynı TR substring iki pair’de → red veya retry
5. **Retry with temperature 0 + stricter prompt** — ilk başarısızlıkta bir kez
6. **Kullanıcıya “AI önerisi” etiketi** — hatalı align → sürükle-bırak (zaten planda)

---

## 5. Önerilen üretim mimarisi (revize)

### 5.1 Pipeline diyagramı

```text
[Kullanıcı yapıştırır] veya [Premium: Generate]
         │
         ▼
┌─────────────────────┐
│ source_text         │  ← Üst kutu (hedef dil)
│ target_text         │  ← Alt kutu (ana dil)
└─────────────────────┘
         │
         ▼ (Premium generate ise Adım 1 bitti)
┌─────────────────────┐
│ splitIntoSentences  │  ← Uygulama kodu (AI değil)
└─────────────────────┘
         │
         ▼  her cümle çifti için (veya kısa metin tek sefer)
┌─────────────────────┐
│ align-text          │  ← SYSTEM_PROMPT.md, pairs ONLY
│ gemini-3.1-flash-lite│     (veya uzun/karmaşık → flash)
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ AlignmentValidator  │  ← coverage, no dash, no dup target
└─────────────────────┘
         │ fail → retry once / manuel UI
         ▼ pass
┌─────────────────────┐
│ MapPairsToSpans     │  ← SPAN_MAPPING.md
│ Highlight + TTS     │
└─────────────────────┘
```

### 5.2 Endpoint ayrımı (sabit)

| Endpoint | Döner | Model |
|----------|-------|-------|
| `generate-lesson` | `source_text`, `target_text` only (**pairs yok**) | Flash-Lite |
| `align-text` | `pairs` only | Flash-Lite (≤1 cümle veya ≤40 kelime); çoklu cümle chunk başına |

**Neden generate’den pairs kaldırıldı:** Benchmark bunu kanıtladı — üç iş bir arada Lite’ı bozuyor.

### 5.3 `AlignmentValidator` kuralları (MVP)

```typescript
// Başarısızlık → 422 İşlenemez + istemci manuel mod
- Her pair.source, source_text içinde alt dizgi olmalı
- Her pair.target, target_text içinde alt dizgi olmalı
- target !== "—" && target.trim() !== ""
- Birleşik kaynak parçaları source_text'i tam kaplar (imleç taraması)
- Birleşik hedef parçaları (konuma göre) target_text'i tam kaplar
- Aynı (başlangıç, bitiş) hedef aralığı iki çiftte kullanılamaz
- Çift sayısı sabit değil; tam kaplama ve anlam doğruluğu öncelikli
```

### 5.4 Granülarite kuralları (revize)

| Koşul | Granülarite |
|-------|-------------|
| ≤ 1 cümle, beginner | `fine` |
| 2–5 cümle, intermediate | `medium` (clause / cümle parçası) |
| ≥ 6 cümle veya ≥ 120 kelime | **Cümle bazlı align** (her cümle ayrı API); paragraf genelinde `coarse` **yasak** |
| advanced + uzun metin | `medium` minimum — advanced ≠ coarse uzun metinde |

### 5.5 Pro-drop kuralı (prompt eklentisi)

`LANGUAGE_PAIR_HINTS.md` → `en-tr`:

```text
İngilizce zamirleri (I, you, he, she, we, they) asla "—" veya boş hedefe eşleme.
Türkçe'de zamiri İngilizce fiil ifadesiyle birleştir
(ör. "I would like to order" ↔ "sipariş etmek istiyorum").
Türkçe özne fiil ekindedir; İngilizce zamirleri kaplamasız bırakma.
```

---

## 6. Model stratejisi — Flash-Lite kalır mı?

| İş | Model önerisi | Gerekçe |
|----|---------------|---------|
| Generate metin | `gemini-3.1-flash-lite` | Senaryo 2 metin kalitesi yeterli; ucuz |
| Align ≤40 kelime | `gemini-3.1-flash-lite` | Senaryo 2 align başarılı potansiyel |
| Align çok cümle | Lite **cümle chunk** veya `gemini-2.5-flash` | Senaryo 3 Lite başarısız |
| Validator retry | Aynı model, sıkı prompt | Bir deneme |
| Fallback | Kullanıcı manuel + sürükle | Her zaman |

**Gemini 3.5 Flash** align-only ikinci görüş için uygun; production align için maliyet/kalite A/B ölçülmeli.

---

## 7. MapPairsToSpans ve UI — benchmark’tan çıkan dersler

1. **Kalitesiz pairs gelirse boyama yapma** — Validator önce
2. **`"—"` gibi hayalet target’lar** — UI’ya hiç gitmemeli
3. **Tık + TTS** yalnızca `MappedPair` doğrulandıktan sonra
4. **Sürükle-bırak** sadece düzeltme değil, **zorunlu güvenlik ağı** — AI %100 değil
5. **Üst kutu = hedef dil (source_text)** — TTS her zaman hedef dilde

---

## 8. L-002 ve dokümantasyon için aksiyon listesi

| # | Aksiyon | Dosya |
|---|---------|-------|
| 1 | `GENERATE_SYSTEM_PROMPT.md` v2 — `pairs` kaldırıldı, yalnızca metin (Türkçe) | docs |
| 2 | `SYSTEM_PROMPT.md` v2 — pro-drop, tire yasağı, esnek çift sayısı (Türkçe) | docs |
| 3 | `ALIGN_VALIDATION.md` — validator kuralları | docs (yeni) |
| 4 | Align-only benchmark — Senaryo 2 metinleri **sabit** user JSON | token_counter script v2 |
| 5 | `UNIT_ECONOMICS.md` §4 — generate ve align **ayrı satırlar** | docs |
| 6 | `ATOMIC-TODO` — L-143 validator, L-201 generate pairsiz | ATOMIC-TODO.md |
| 7 | `splitIntoSentences` + chunk align use case | Faz 13 |

---

## 9. Sonuç cümlesi

**Matematik doğru, pedagoji yanlış.** Flash-Lite ucuz ve hızlı ama “tek istekte üret + çevir + ince hizala” mimarisi — özellikle uzun TR↔EN metinlerde — **üretime hazır değil**. LinguaLink’in güvenilir olması için:

1. **İşleri ayır** (generate ≠ align)  
2. **Metni parçala** (cümle chunk)  
3. **Sunucuda doğrula** (coverage, no dash, no dup)  
4. **Uygulamada boya** (MapPairsToSpans)  
5. **Kullanıcıya düzelt** (tap + TTS + drag)

Gemini 3.5 Flash’ın teşhisi doğru; eksik parça **testin align değil generate olması** ve **validator + chunk pipeline**’ın henüz planda kod olarak netleşmemiş olmasıdır. Bir sonraki adım: **align-only benchmark (Senaryo 2 metinleriyle)** + **prompt v2** + **validator spec**.

---

## 10. Referanslar

- `c:\Users\tahaa\Desktop\token_counter\benchmark_results.md`
- `c:\Users\tahaa\Desktop\token_counter\benchmark_test.py`
- [SYSTEM_PROMPT.md](./SYSTEM_PROMPT.md)
- [GENERATE_SYSTEM_PROMPT.md](./GENERATE_SYSTEM_PROMPT.md)
- [SPAN_MAPPING.md](./SPAN_MAPPING.md)
- [UNIT_ECONOMICS.md](./UNIT_ECONOMICS.md)
