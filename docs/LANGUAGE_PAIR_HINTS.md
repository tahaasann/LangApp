# LinguaLink — Language Pair Hints (GRAMMAR_NOTES injection)

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

## Generic fallback (bilinmeyen çift)

```text
Align by meaning, not word-for-word order. Respect agglutination, clitics, separable verbs, and article gender. Choose pedagogically useful chunks for {{learner_level}}. Full text coverage on both sides is mandatory.
```

---

## Örnek çift notları

### en ↔ tr

```text
English SVO vs Turkish SOV in subordinate clauses. Possessives: "my life" ↔ "hayatım". Turkish agglutination: one Turkish suffix may map to multiple English words. Question particles and "although/because" often map to clause-final Turkish morphemes — still use exact contiguous substrings from target_text.
```

### de ↔ es

```text
German verb-second and separable verb prefixes (trennbare Verben). Spanish SVO. Gendered articles (der/die/das) do not map 1:1 to Spanish articles. Adjective endings in German often bundle meaning spread across Spanish words.
```

### en ↔ de

```text
Shared Germanic roots sometimes false friends. German noun capitalization. Separable verbs split in main clauses. English phrasal verbs may map to single German verbs.
```

### ja ↔ en

```text
Japanese topic-marker は, particles, and SOV order. English subject-prominent. Politeness level must match input register. Kana/kanji boundaries matter for substring integrity.
```

---

## learner_level → granularity

| learner_level | granularity | Uzun cümle pair sayısı (tipik) |
|---------------|-------------|--------------------------------|
| beginner | fine | 12–25 |
| intermediate | medium | 6–14 |
| advanced | coarse | 3–8 |

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

Çift tablosu zamanla genişletilir; MVP'de generic + en-tr + en-de + de-es yeterli.
