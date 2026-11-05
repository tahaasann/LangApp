import { describe, expect, it } from "vitest";
import { validateAlignment } from "./validate-alignment.ts";

const sourceText = "Today is so beautiful.";
const targetText = "Bugün çok güzel.";
const pairs = [
  { order: 0, source: "Today is ", target: "Bugün " },
  { order: 1, source: "so beautiful.", target: "çok güzel." },
];

const codes = (input: Parameters<typeof validateAlignment>[0], lenient = false) =>
  validateAlignment(input, { allowWhitespaceGaps: lenient }).errors.map((error) => error.code);

describe("validateAlignment", () => {
  it("tam kaplamalı çiftleri kabul eder", () => {
    expect(validateAlignment({ sourceText, targetText, pairs }).valid).toBe(true);
  });

  it("hedef sırası kaynak sırasından farklı olabilir", () => {
    const input = {
      sourceText: "I saw him yesterday",
      targetText: "dün onu gördüm",
      pairs: [
        { order: 0, source: "I saw", target: "gördüm" },
        { order: 1, source: " him", target: "onu " },
        { order: 2, source: " yesterday", target: "dün " },
      ],
    };
    expect(validateAlignment(input).valid).toBe(true);
  });

  it("sıralı olmayan order değerini reddeder", () => {
    const input = { sourceText, targetText, pairs: [{ ...pairs[0]!, order: 1 }, pairs[1]!] };
    expect(codes(input)).toContain("ORDER_INVALID");
  });

  it("hayalet hedefi reddeder", () => {
    const input = {
      sourceText,
      targetText,
      pairs: [{ order: 0, source: "Today is ", target: "—" }, pairs[1]!],
    };
    expect(codes(input)).toContain("TARGET_NOT_FOUND");
  });

  it("boş ifadeyi reddeder", () => {
    const input = {
      sourceText,
      targetText,
      pairs: [{ order: 0, source: "Today is ", target: "  " }, pairs[1]!],
    };
    expect(codes(input)).toContain("EMPTY_PHRASE");
  });

  it("metinde olmayan kaynağı reddeder", () => {
    const input = {
      sourceText,
      targetText,
      pairs: [{ order: 0, source: "Tomorrow is ", target: "Bugün " }, pairs[1]!],
    };
    expect(codes(input)).toContain("SOURCE_NOT_FOUND");
  });

  it("eksik kaynak kaplamasını reddeder", () => {
    const input = { sourceText, targetText, pairs: [pairs[0]!] };
    expect(codes(input)).toContain("SOURCE_COVERAGE");
  });

  it("tekrarlı hedefi iki ayrı konuma yerleştirir", () => {
    const input = {
      sourceText: "today and today",
      targetText: "bugün ve bugün",
      pairs: [
        { order: 0, source: "today", target: "bugün" },
        { order: 1, source: " and ", target: " ve " },
        { order: 2, source: "today", target: "bugün" },
      ],
    };
    expect(validateAlignment(input).valid).toBe(true);
  });

  it("aynı hedef konuma iki çifti reddeder", () => {
    const input = {
      sourceText: "good morning",
      targetText: "günaydın dostum",
      pairs: [
        { order: 0, source: "good ", target: "günaydın dostum" },
        { order: 1, source: "morning", target: "günaydın dostum" },
      ],
    };
    expect(codes(input)).toContain("TARGET_COVERAGE");
  });

  it("kısa hedef uzun hedefin içinde geçse de doğru yerleşimi bulur", () => {
    const input = {
      sourceText: "ab",
      targetText: "xyx",
      pairs: [
        { order: 0, source: "a", target: "x" },
        { order: 1, source: "b", target: "yx" },
      ],
    };
    expect(validateAlignment(input).valid).toBe(true);
  });

  it("boşluk atlanan parçaları yalnızca esnek modda kabul eder", () => {
    const input = {
      sourceText,
      targetText,
      pairs: [
        { order: 0, source: "Today is", target: "Bugün" },
        { order: 1, source: "so beautiful.", target: "çok güzel." },
      ],
    };
    expect(codes(input)).toEqual(expect.arrayContaining(["SOURCE_COVERAGE", "TARGET_COVERAGE"]));
    expect(codes(input, true)).toEqual([]);
  });

  it("esnek mod eksik kelimeye izin vermez", () => {
    const input = {
      sourceText,
      targetText,
      pairs: [{ order: 0, source: "Today is", target: "Bugün" }],
    };
    expect(codes(input, true)).toEqual(expect.arrayContaining(["SOURCE_COVERAGE", "TARGET_COVERAGE"]));
  });
});
