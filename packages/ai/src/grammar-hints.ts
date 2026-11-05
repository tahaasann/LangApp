import type { LanguageCode, LearnerLevel } from "@lingualink/contracts";

const EN_TR =
  'İngilizce SVO, Türkçe yan cümlelerde SOV. İyelik: "my life" ↔ "hayatım". Türkçe eklemeli yapı: tek Türkçe ek birden fazla İngilizce kelimeye karşılık gelebilir. Soru edatları ve "although/because" çoğu zaman cümle sonu Türkçe eklerine denk gelir — yine de target_text\'ten birebir ardışık alt dizgi kullan. Pro-drop: Türkçe\'de özne çoğu zaman fiil ekindedir (-um, -sun); İngilizce zamir (I, you, we) ayrı çift olmamalı, fiil ifadesiyle birleştir. Örnek: "I would like to order" ↔ "sipariş etmek istiyorum".';
const DE_ES =
  "Almanca fiil ikinci pozisyon ve ayrılabilir fiil önekleri (trennbare Verben). İspanyolca SVO. Almanca artikeller (der/die/das) İspanyolca artikellerle birebir eşleşmez. Almanca sıfat ekleri anlamı İspanyolca birden fazla kelimeye yayabilir.";
const EN_DE =
  "Ortak Cermen kökleri bazen yanlış arkadaş (false friend). Almanca isim büyük harfi. Ana cümlede ayrılabilir fiiller bölünür. İngilizce phrasal fiiller tek Almanca fiile denk gelebilir.";
const JA_EN =
  "Japonca konu işareti は, parçacıklar ve SOV sırası. İngilizce özne merkezli. Nezaket düzeyi girdi kaydına uymalı. Kana/kanji sınırları alt dizgi bütünlüğü için önemli.";

const PAIR_HINTS: Partial<Record<string, string>> = {
  "en-tr": EN_TR,
  "de-es": DE_ES,
  "de-en": EN_DE,
  "en-ja": JA_EN,
};

/** Metinler: docs/LANGUAGE_PAIR_HINTS.md */
export function buildGrammarHints(
  learning: LanguageCode,
  native: LanguageCode,
  level: LearnerLevel = "beginner",
): string {
  const key = [learning, native].sort().join("-");
  return (
    PAIR_HINTS[key] ??
    `Kelime kelime sıra yerine anlama göre eşleştir. Eklemeli diller, klitikler, ayrılabilir fiiller ve artikel cinsiyetine saygı göster. ${level} seviyesi için pedagojik olarak faydalı parçalar seç. Her iki tarafta tam metin kaplaması zorunludur.`
  );
}
