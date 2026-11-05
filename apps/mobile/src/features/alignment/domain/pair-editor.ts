import type { MappedPair, TextSpan } from "@lingualink/contracts";
import { colorForOrder } from "./map-pairs-to-spans";

export type TextRange = { start: number; end: number };
export type Token = TextRange & { text: string };

export type TextSegment =
  | { kind: "plain"; start: number; end: number; text: string }
  | { kind: "span"; start: number; end: number; text: string; span: TextSpan };

const CJK = "\\u3040-\\u30ff\\u3400-\\u9fff\\uf900-\\ufaff";
const TOKEN = new RegExp(`[${CJK}]|[^\\s${CJK}]+`, "g");

/** Elle seçim birimleri: kelimeler; boşluksuz yazılan dillerde tek tek karakterler. */
export function tokenize(text: string): Token[] {
  return [...text.matchAll(TOKEN)].map((match) => ({
    start: match.index,
    end: match.index + match[0].length,
    text: match[0],
  }));
}

export function segmentText(text: string, spans: readonly TextSpan[]): TextSegment[] {
  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const span of [...spans].sort((a, b) => a.start - b.start)) {
    if (span.start > cursor) {
      segments.push({ kind: "plain", start: cursor, end: span.start, text: text.slice(cursor, span.start) });
    }
    segments.push({ kind: "span", start: span.start, end: span.end, text: text.slice(span.start, span.end), span });
    cursor = span.end;
  }
  if (cursor < text.length) {
    segments.push({ kind: "plain", start: cursor, end: text.length, text: text.slice(cursor) });
  }
  return segments;
}

const overlaps = (a: TextRange, b: TextRange) => a.start < b.end && b.start < a.end;

/** Kaynak konumuna göre sıralar; numara ve rengi yeniden verir. */
function renumber(pairs: readonly MappedPair[]): MappedPair[] {
  return [...pairs]
    .sort((a, b) => a.source.start - b.source.start)
    .map((pair, order) => {
      const color = colorForOrder(order);
      return {
        order,
        source: { ...pair.source, pairOrder: order, color },
        target: { ...pair.target, pairOrder: order, color },
      };
    });
}

export class ManualPairError extends Error {}

export type ManualPairInput = {
  sourceText: string;
  targetText: string;
  source: TextRange;
  target: TextRange;
};

export function addManualPair(pairs: readonly MappedPair[], input: ManualPairInput): MappedPair[] {
  const { source, target, sourceText, targetText } = input;
  if (source.end <= source.start || target.end <= target.start) {
    throw new ManualPairError("Her iki metinden de seçim yapılmalı");
  }
  if (pairs.some((pair) => overlaps(pair.source, source) || overlaps(pair.target, target))) {
    throw new ManualPairError("Seçim mevcut bir eşleşmeyle çakışıyor");
  }
  const spanOf = (range: TextRange, text: string): TextSpan => ({
    pairOrder: 0,
    start: range.start,
    end: range.end,
    text: text.slice(range.start, range.end),
    color: colorForOrder(0),
  });
  return renumber([
    ...pairs,
    { order: 0, source: spanOf(source, sourceText), target: spanOf(target, targetText) },
  ]);
}

export function removePair(pairs: readonly MappedPair[], order: number): MappedPair[] {
  return renumber(pairs.filter((pair) => pair.order !== order));
}

export function hasOverlaps(pairs: readonly MappedPair[]): boolean {
  const crosses = (side: "source" | "target") => {
    const sorted = pairs.map((pair) => pair[side]).sort((a, b) => a.start - b.start);
    return sorted.some((span, index) => index > 0 && span.start < (sorted[index - 1] as TextSpan).end);
  };
  return crosses("source") || crosses("target");
}
