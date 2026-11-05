# LinguaLink — Span Mapping & Highlight Architecture

> **Sorumluluk:** AI `pairs[]` döner → **uygulama** metinde konum bulur, renkler, tıklama/TTS/sürükle yönetir.  
> **Hexagonal:** `MapPairsToSpansUseCase` (application), `HighlightText` (presentation)

---

## 1. Veri akışı

```text
[Üst kutu] source_text  (hedef dil)
[Alt kutu] target_text  (ana dil)
       ↓  AI Eşleştir
pairs: [{ order, source, target }, ...]
       ↓  MapPairsToSpansUseCase
MappedPair[]: { order, sourceSpan, targetSpan, color }
       ↓  HighlightText
Renkli, tıklanabilir UI
```

| Katman | Sorumlu |
|--------|---------|
| Metin gösterimi | CreateLessonScreen (üst/alt kutular) |
| AI eşleştirme | Claude Haiku 5.5 + `SYSTEM_PROMPT.md` |
| Doğrulama | `AlignmentValidator` (`ALIGN_VALIDATION.md`) |
| Konum + renk | `MapPairsToSpansUseCase` |
| Etkileşim | `HighlightText`, `SpeakPairUseCase`, `RealignPairUseCase` |

---

## 2. Renk paleti (uygulama atar — AI değil)

24 renk, `order % 24` ile döngüsel:

```typescript
export const HIGHLIGHT_PALETTE = [
  "#E74C3C", "#9B59B6", "#3498DB", "#1ABC9C", "#2ECC71", "#F1C40F",
  "#E67E22", "#E91E63", "#34495E", "#7F8C8D", "#16A085", "#27AE60",
  "#2980B9", "#8E44AD", "#2C3E50", "#F39C12", "#D35400", "#BDC3C7",
  "#C0392B", "#7E57C2", "#26A69A", "#EC407A", "#5C6BC0", "#66BB6A",
] as const;
```

---

## 3. MapPairsToSpansUseCase

### Girdi

```typescript
type MapPairsInput = {
  sourceText: string;
  targetText: string;
  pairs: Array<{ order: number; source: string; target: string }>;
};
```

### Çıktı

```typescript
type TextSpan = {
  pairOrder: number;
  start: number; // UTF-16 index
  end: number;
  text: string;
  color: string;
};

type MappedPair = {
  order: number;
  source: TextSpan;
  target: TextSpan;
};
```

### Algoritma (MVP)

**Source tarafı:**

1. `pairs`'i `order` ile sırala.
2. `searchFrom = 0` ile başla.
3. Her pair için `sourceText.indexOf(pair.source, searchFrom)`.
4. Bulunamazsa → `SpanMappingError` (manuel düzeltme veya AI retry).
5. `searchFrom = end` (overlap yok).

**Target tarafı:**

1. Her pair için `pair.target`'ın `targetText` içindeki, kullanılmamış aralıklarla çakışmayan ilk konumunu seç. Tekrarlı ifadeler ("bugün ... bugün") bu sayede ayrı konumlara yerleşir.
2. Çakışmasız konum yoksa → `SpanMappingError`.
3. Tam kaplama: `sourceText` ve `targetText` karakterleri bir span'a bağlı mı? Yalnızca boşluktan oluşan aralıklar span dışında kalabilir ve renksiz çizilir (`ALIGN_VALIDATION.md`).
4. `pairs` kaynak sırasında gelmezse `SOURCE_COVERAGE` hatası verir; model yanıtı sıralanmaz, yeniden denenir.

### Domain port

```typescript
interface IPairSpanMapper {
  map(input: MapPairsInput): MappedPair[];
  validateFullCoverage(sourceText: string, targetText: string, mapped: MappedPair[]): boolean;
}
```

---

## 4. HighlightText (presentation)

- İki kutu: **üst** = hedef dil (`source_text`), **alt** = ana dil (`target_text`).
- Her span `Pressable` + arka plan rengi (`span.color`).
- `selectedOrder: number | null` — tıklanınca her iki kutuda aynı `order` vurgulanır (border veya opacity).

### Tıklama

| Aksiyon | Sonuç |
|---------|--------|
| Ana dil span'a tık | Hedef dil eş span highlight + **TTS hedef dil** |
| Hedef dil span'a tık | Ana dil eş span highlight + **TTS hedef dil** (öğrenme odaklı) |

`SpeakPairUseCase`: `expo-speech`, `language: targetLanguageCode`, metin = pair'in `source` metni.

---

## 5. RealignPairUseCase (basılı tut + sürükle)

**Amaç:** Yanlış AI eşleşmesini düzeltmek.

**MVP davranışı:**

1. Uzun bas (500ms+) bir span'da → sürükleme modu.
2. Bırakılan hedef span ile **pair order yeniden atama** veya iki pair'in `target`/`source` swap.
3. `MapPairsToSpansUseCase` yeniden çalıştır (metin değişmediyse sadece pair listesi güncellenir).
4. Persist: güncel `pairs` ders kaydına yazılır.

**Not:** Metin sınırını yeniden çizmek (split/merge span) manuel eşleştirme modunda (L-080+) kalır.

---

## 6. SQLite şeması (pairs — düz liste)

```sql
-- alignment_pairs (depth/parent_id YOK)
CREATE TABLE alignment_pairs (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL,
  pair_order INTEGER NOT NULL,
  source_phrase TEXT NOT NULL,
  target_phrase TEXT NOT NULL,
  source_start INTEGER,
  source_end INTEGER,
  target_start INTEGER,
  target_end INTEGER,
  color TEXT NOT NULL
);
```

Span index'leri kayıt anında `MapPairsToSpans` sonucundan yazılır — tekrar map gerekmez.

---

## 7. Hata senaryoları

| Hata | UX |
|------|-----|
| `SpanNotFoundError` | "Eşleştirme konumu bulunamadı — manuel düzeltin" |
| Coverage fail | AI'yı tekrar dene veya manuel mod |
| Duplicate substring | Source'ta `searchFrom` cursor, target'ta kullanılmamış konum seçimi |
