import type { MappedPair } from "@lingualink/contracts";
import { HIGHLIGHT_PALETTE } from "@lingualink/contracts";
import {
  addManualPair,
  ManualPairError,
  removePair,
  segmentText,
  tokenize,
} from "./pair-editor";

const span = (order: number, start: number, end: number, text: string) => ({
  pairOrder: order,
  start,
  end,
  text,
  color: HIGHLIGHT_PALETTE[order] as string,
});
const pair = (
  order: number,
  source: [number, number, string],
  target: [number, number, string],
): MappedPair => ({ order, source: span(order, ...source), target: span(order, ...target) });

describe("tokenize", () => {
  it("boşluklara göre böler ve konumları korur", () => {
    expect(tokenize("Good  morning.")).toEqual([
      { start: 0, end: 4, text: "Good" },
      { start: 6, end: 14, text: "morning." },
    ]);
  });

  it("Türkçe ve Latin dışı alfabeleri bölmez", () => {
    expect(tokenize("Günaydın, Привет").map((token) => token.text)).toEqual(["Günaydın,", "Привет"]);
  });

  it("Japonca ve Çince karakterleri tek tek seçilebilir yapar", () => {
    expect(tokenize("私は学生").map((token) => token.text)).toEqual(["私", "は", "学", "生"]);
  });

  it("boş metinde boş liste döner", () => {
    expect(tokenize("  ")).toEqual([]);
  });
});

describe("segmentText", () => {
  it("span ve düz metni sırayla verir", () => {
    const segments = segmentText("Good morning you", [span(0, 5, 12, "morning")]);
    expect(segments.map((segment) => [segment.kind, segment.text])).toEqual([
      ["plain", "Good "],
      ["span", "morning"],
      ["plain", " you"],
    ]);
  });

  it("span verilmezse tek düz parça döner", () => {
    expect(segmentText("Hello", [])).toEqual([{ kind: "plain", start: 0, end: 5, text: "Hello" }]);
  });

  it("sırasız span'ları konumuna göre dizer", () => {
    const segments = segmentText("ab", [span(1, 1, 2, "b"), span(0, 0, 1, "a")]);
    expect(segments.map((segment) => segment.text)).toEqual(["a", "b"]);
  });
});

describe("addManualPair", () => {
  const texts = { sourceText: "Good morning", targetText: "Gün aydın" };

  it("yeni çifti ekler, kaynak sırasına göre numaralar ve renkler", () => {
    const existing = [pair(0, [5, 12, "morning"], [4, 9, "aydın"])];
    const result = addManualPair(existing, { ...texts, source: { start: 0, end: 4 }, target: { start: 0, end: 3 } });
    expect(result.map((item) => item.source.text)).toEqual(["Good", "morning"]);
    expect(result.map((item) => item.order)).toEqual([0, 1]);
    expect(result[1]?.source.color).toBe(HIGHLIGHT_PALETTE[1]);
    expect(result[1]?.target.pairOrder).toBe(1);
  });

  it.each([
    ["kaynak", { start: 6, end: 9 }, { start: 0, end: 3 }],
    ["hedef", { start: 0, end: 4 }, { start: 5, end: 8 }],
  ])("%s tarafında örtüşmeyi reddeder", (_side, source, target) => {
    const existing = [pair(0, [5, 12, "morning"], [4, 9, "aydın"])];
    expect(() => addManualPair(existing, { ...texts, source, target })).toThrow(ManualPairError);
  });

  it("boş aralığı reddeder", () => {
    expect(() =>
      addManualPair([], { ...texts, source: { start: 2, end: 2 }, target: { start: 0, end: 3 } }),
    ).toThrow(ManualPairError);
  });
});

describe("removePair", () => {
  it("çifti siler ve kalanları yeniden numaralar", () => {
    const pairs = [
      pair(0, [0, 4, "Good"], [0, 3, "Gün"]),
      pair(1, [5, 12, "morning"], [4, 9, "aydın"]),
    ];
    const result = removePair(pairs, 0);
    expect(result).toHaveLength(1);
    expect(result[0]?.order).toBe(0);
    expect(result[0]?.source.pairOrder).toBe(0);
    expect(result[0]?.source.color).toBe(HIGHLIGHT_PALETTE[0]);
    expect(pairs).toHaveLength(2);
  });
});
