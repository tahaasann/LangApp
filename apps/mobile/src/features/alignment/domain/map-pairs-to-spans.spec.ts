import { HIGHLIGHT_PALETTE } from "@lingualink/contracts";
import { mapPairsToSpans, SpanMappingError } from "./map-pairs-to-spans";

describe("mapPairsToSpans", () => {
  it("konum, metin ve rengi hesaplar", () => {
    const [first, second] = mapPairsToSpans({
      sourceText: "Good morning",
      targetText: "Gün aydın",
      pairs: [
        { order: 0, source: "Good ", target: "Gün " },
        { order: 1, source: "morning", target: "aydın" },
      ],
    });
    expect(first?.source).toEqual({ pairOrder: 0, start: 0, end: 5, text: "Good ", color: HIGHLIGHT_PALETTE[0] });
    expect(second?.target).toEqual({ pairOrder: 1, start: 4, end: 9, text: "aydın", color: HIGHLIGHT_PALETTE[1] });
  });

  it("hedef sırası farklı olduğunda doğru konuma yerleştirir", () => {
    const mapped = mapPairsToSpans({
      sourceText: "my life",
      targetText: "hayatım benim",
      pairs: [
        { order: 0, source: "my ", target: "benim" },
        { order: 1, source: "life", target: "hayatım " },
      ],
    });
    expect(mapped[0]?.target.start).toBe(8);
    expect(mapped[1]?.target.start).toBe(0);
  });

  it("tekrarlı ifadeleri ayrı konumlara yerleştirir", () => {
    const mapped = mapPairsToSpans({
      sourceText: "today and today",
      targetText: "bugün ve bugün",
      pairs: [
        { order: 0, source: "today", target: "bugün" },
        { order: 1, source: " and ", target: " ve " },
        { order: 2, source: "today", target: "bugün" },
      ],
    });
    expect(mapped.map((pair) => pair.source.start)).toEqual([0, 5, 10]);
    expect(mapped.map((pair) => pair.target.start)).toEqual([0, 5, 9]);
  });

  it("boşluk atlanmış parçaları kabul eder", () => {
    const mapped = mapPairsToSpans({
      sourceText: "Good morning",
      targetText: "Gün aydın",
      pairs: [
        { order: 0, source: "Good", target: "Gün" },
        { order: 1, source: "morning", target: "aydın" },
      ],
    });
    expect(mapped[1]?.source.start).toBe(5);
  });

  it("order sırasına göre işler", () => {
    const mapped = mapPairsToSpans({
      sourceText: "a b",
      targetText: "c d",
      pairs: [
        { order: 1, source: "b", target: "d" },
        { order: 0, source: "a ", target: "c " },
      ],
    });
    expect(mapped.map((pair) => pair.order)).toEqual([0, 1]);
  });

  it("paleti döngüsel kullanır", () => {
    const words = Array.from({ length: HIGHLIGHT_PALETTE.length + 1 }, (_, index) => `w${index}`);
    const text = words.join(" ");
    const mapped = mapPairsToSpans({
      sourceText: text,
      targetText: text,
      pairs: words.map((word, order) => ({ order, source: word, target: word })),
    });
    expect(mapped.at(-1)?.source.color).toBe(HIGHLIGHT_PALETTE[0]);
  });

  it("metne yerleşmeyen çiftte hata verir", () => {
    expect(() =>
      mapPairsToSpans({
        sourceText: "Good",
        targetText: "İyi",
        pairs: [{ order: 0, source: "Bad", target: "İyi" }],
      }),
    ).toThrow(SpanMappingError);
    expect(() =>
      mapPairsToSpans({
        sourceText: "Good",
        targetText: "İyi",
        pairs: [{ order: 0, source: "Good", target: "Kötü" }],
      }),
    ).toThrow(SpanMappingError);
  });
});
