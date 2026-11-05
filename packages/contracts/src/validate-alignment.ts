import type { AlignmentPair } from "./alignment-pair.ts";

export type AlignmentErrorCode =
  | "ORDER_INVALID"
  | "EMPTY_PHRASE"
  | "SOURCE_NOT_FOUND"
  | "TARGET_NOT_FOUND"
  | "SOURCE_COVERAGE"
  | "TARGET_COVERAGE";

export type AlignmentError = { code: AlignmentErrorCode; order?: number };

export type AlignmentValidationResult = {
  valid: boolean;
  errors: AlignmentError[];
};

export type AlignmentInput = {
  sourceText: string;
  targetText: string;
  pairs: readonly AlignmentPair[];
};

export type AlignmentValidationOptions = {
  /** Parçalar arasında yalnızca boşluk atlanmasına izin verir. */
  allowWhitespaceGaps?: boolean;
};

function skipWhitespace(text: string, position: number): number {
  let next = position;
  while (next < text.length && /\s/u.test(text.charAt(next))) next += 1;
  return next;
}

function coversSource(text: string, phrases: readonly string[], lenient: boolean): boolean {
  let cursor = 0;
  for (const phrase of phrases) {
    if (lenient && !text.startsWith(phrase, cursor)) cursor = skipWhitespace(text, cursor);
    if (!text.startsWith(phrase, cursor)) return false;
    cursor += phrase.length;
  }
  return (lenient ? skipWhitespace(text, cursor) : cursor) === text.length;
}

/**
 * Hedef parçalar sırasız gelebilir ve aynı metin birden çok kez geçebilir;
 * bu yüzden açgözlü arama yerine tam kaplama araması yapılır.
 */
function coversTarget(text: string, phrases: readonly string[], lenient: boolean): boolean {
  const remaining = new Map<string, number>();
  for (const phrase of phrases) remaining.set(phrase, (remaining.get(phrase) ?? 0) + 1);
  const distinct = [...remaining.keys()].sort((a, b) => b.length - a.length);
  const failed = new Set<string>();

  const place = (start: number, left: number): boolean => {
    const afterGap = lenient ? skipWhitespace(text, start) : start;
    if (left === 0) return afterGap === text.length;
    const state = `${start}|${distinct.map((phrase) => remaining.get(phrase)).join(",")}`;
    if (failed.has(state)) return false;
    // Boşluk parçanın kendisine ait olabilir; önce birebir konum denenir.
    for (const position of afterGap === start ? [start] : [start, afterGap]) {
      for (const phrase of distinct) {
        const count = remaining.get(phrase) ?? 0;
        if (count === 0 || !text.startsWith(phrase, position)) continue;
        remaining.set(phrase, count - 1);
        const placed = place(position + phrase.length, left - 1);
        remaining.set(phrase, count);
        if (placed) return true;
      }
    }
    failed.add(state);
    return false;
  };

  return place(0, phrases.length);
}

/** Kurallar: docs/ALIGN_VALIDATION.md */
export function validateAlignment(
  { sourceText, targetText, pairs }: AlignmentInput,
  { allowWhitespaceGaps = false }: AlignmentValidationOptions = {},
): AlignmentValidationResult {
  const errors: AlignmentError[] = [];

  pairs.forEach((pair, index) => {
    if (pair.order !== index) errors.push({ code: "ORDER_INVALID", order: pair.order });
    if (pair.source.trim() === "" || pair.target.trim() === "") {
      errors.push({ code: "EMPTY_PHRASE", order: pair.order });
    }
    if (!sourceText.includes(pair.source)) {
      errors.push({ code: "SOURCE_NOT_FOUND", order: pair.order });
    }
    if (!targetText.includes(pair.target)) {
      errors.push({ code: "TARGET_NOT_FOUND", order: pair.order });
    }
  });

  const sources = pairs.map((pair) => pair.source);
  const targets = pairs.map((pair) => pair.target);
  if (!coversSource(sourceText, sources, allowWhitespaceGaps)) {
    errors.push({ code: "SOURCE_COVERAGE" });
  }
  if (!coversTarget(targetText, targets, allowWhitespaceGaps)) {
    errors.push({ code: "TARGET_COVERAGE" });
  }

  return { valid: errors.length === 0, errors };
}
