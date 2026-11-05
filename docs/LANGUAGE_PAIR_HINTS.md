# LinguaLink — Dil Çifti İpuçları (DİLBİLGİSİ_NOTLARI enjeksiyonu)

> **Kullanım:** `buildAlignmentPrompt()` / Edge Function her istekte `{{grammar_hints}}` olarak enjekte eder.  
> **Diller:** 12 kod — hedef ve ana dil aynı listeden (`packages/contracts` L-021).

---

## Desteklenen diller

| Kod | Ad |
|-----|-----|
| en | English |
| tr | Türkçe |
| es | Español |
| de | Deutsch |
| fr | Français |
| it | Italiano |
| pt | Português |
| ja | 日本語 |
| ko | 한국어 |
| ar | العربية |
| zh | 中文 |
| ru | Русский |

---

## Genel yedek (bilinmeyen çift)

```text
Kelime kelime sıra yerine anlama göre eşleştir. Eklemeli diller, klitikler, ayrılabilir fiiller ve artikel cinsiyetine saygı göster. {{learner_level}} seviyesi için pedagojik olarak faydalı parçalar seç. Her iki tarafta tam metin kaplaması zorunludur.
```

---

## Örnek çift notları

### en ↔ tr

```text
İngilizce SVO, Türkçe yan cümlelerde SOV. İyelik: "my life" ↔ "hayatım". Türkçe eklemeli yapı: tek Türkçe ek birden fazla İngilizce kelimeye karşılık gelebilir. Soru edatları ve "although/because" çoğu zaman cümle sonu Türkçe eklerine denk gelir — yine de target_text'ten birebir ardışık alt dizgi kullan. Pro-drop: İngilizce zamir (I, you, we) ayrı çift olmamalı; fiil ifadesiyle birleştir. "—" veya boş hedef yasak.
```

### de ↔ es

```text
Almanca fiil ikinci pozisyon ve ayrılabilir fiil önekleri (trennbare Verben). İspanyolca SVO. Almanca artikeller (der/die/das) İspanyolca artikellerle birebir eşleşmez. Almanca sıfat ekleri anlamı İspanyolca birden fazla kelimeye yayabilir.
```

### en ↔ de

```text
Ortak Cermen kökleri bazen yanlış arkadaş (false friend). Almanca isim büyük harfi. Ana cümlede ayrılabilir fiiller bölünür. İngilizce phrasal fiiller tek Almanca fiile denk gelebilir.
```

### ja ↔ en

```text
Japonca konu işareti は, parçacıklar ve SOV sırası. İngilizce özne merkezli. Nezaket düzeyi girdi kaydına uymalı. Kana/kanji sınırları alt dizgi bütünlüğü için önemli.
```

---

## öğrenen_seviyesi → granülarite

| öğrenen_seviyesi | granülarite | Uzun cümle çift sayısı (tipik — üst sınır değil) |
|------------------|-------------|--------------------------------------------------|
| beginner | fine | genelde daha fazla küçük parça |
| intermediate | medium | dengeli parçalar |
| advanced | coarse | yalnızca kısa tek cümlede büyük bloklar |

Çift sayısı ihtiyaca göre esnektir; tablo yalnızca parça boyutu rehberidir.

Edge Function veya mobil istemci onboarding'den `learner_level` okur ve prompt'a enjekte eder.

---

## Uygulama (L-140+)

```typescript
// packages/prompts/buildGrammarHints.ts
export function buildGrammarHints(
  sourceCode: LanguageCode,
  targetCode: LanguageCode,
): string {
  const key = `${sourceCode}-${targetCode}`;
  return PAIR_HINTS[key] ?? GENERIC_FALLBACK;
}
```

Çift tablosu zamanla genişletilir; MVP'de genel yedek + en-tr + en-de + de-es yeterli.
