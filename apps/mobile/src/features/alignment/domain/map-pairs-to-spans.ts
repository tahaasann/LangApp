import { HIGHLIGHT_PALETTE, locateSources, locateTargets } from "@lingualink/contracts";
import type { AlignmentPair, MappedPair, TextSpan } from "@lingualink/contracts";

export class SpanMappingError extends Error {}

export const colorForOrder = (order: number): string =>
  HIGHLIGHT_PALETTE[order % HIGHLIGHT_PALETTE.length] as string;

const span = (pairOrder: number, start: number, text: string): TextSpan => ({
  pairOrder,
  start,
  end: start + text.length,
  text,
  color: colorForOrder(pairOrder),
});

export type MapPairsInput = {
  sourceText: string;
  targetText: string;
  pairs: readonly AlignmentPair[];
};

/** Kurallar: docs/SPAN_MAPPING.md. Yalnızca boşluktan oluşan aralıklar span dışında kalabilir. */
export function mapPairsToSpans({ sourceText, targetText, pairs }: MapPairsInput): MappedPair[] {
  const sorted = [...pairs].sort((a, b) => a.order - b.order);
  const sourceStarts = locateSources(sourceText, sorted.map((pair) => pair.source), true);
  const targetStarts = locateTargets(targetText, sorted.map((pair) => pair.target), true);
  if (!sourceStarts || !targetStarts) {
    throw new SpanMappingError("Çiftler metne yerleştirilemedi");
  }
  return sorted.map((pair, index) => ({
    order: pair.order,
    source: span(pair.order, sourceStarts[index] as number, pair.source),
    target: span(pair.order, targetStarts[index] as number, pair.target),
  }));
}
