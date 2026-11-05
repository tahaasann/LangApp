import type { MappedPair } from "@lingualink/contracts";
import { HIGHLIGHT_PALETTE, MAX_SOURCE_TEXT_LENGTH } from "@lingualink/contracts";
import { decodeLessonLink, encodeLessonLink } from "./lesson-share-codec";
import type { SharedLesson } from "./lesson-share-codec";

const span = (order: number, start: number, end: number, text: string) => ({
  pairOrder: order,
  start,
  end,
  text,
  color: HIGHLIGHT_PALETTE[order] as string,
});
const pairs: MappedPair[] = [
  { order: 0, source: span(0, 0, 7, "Günaydı"), target: span(0, 0, 3, "こんに") },
  { order: 1, source: span(1, 7, 8, "n"), target: span(1, 3, 5, "ちは") },
];
const lesson: SharedLesson = {
  title: "Selam 😀 ğüşıöç",
  learningLanguage: "tr",
  nativeLanguage: "ja",
  sourceText: "Günaydın",
  targetText: "こんにちは",
  pairs,
};
const payloadOf = (link: string) => link.split("d=")[1] ?? "";
const encodeRaw = (value: unknown) =>
  // Bozuk bağlantı üretmek için kodlayıcının kendisi kullanılır; geçerli alanlar sonra bozulur.
  encodeLessonLink(value as SharedLesson);

describe("lesson share codec", () => {
  it("Unicode içeriği kayıpsız taşır", () => {
    const link = encodeLessonLink(lesson);
    expect(link.startsWith("lingualink://import?d=")).toBe(true);
    expect(payloadOf(link)).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeLessonLink(link)).toEqual(lesson);
  });

  it("yalnızca kodu da çözer", () => {
    expect(decodeLessonLink(payloadOf(encodeLessonLink(lesson)))).toEqual(lesson);
  });

  it("eşleştirmesiz dersi taşır", () => {
    const empty = { ...lesson, pairs: [] };
    expect(decodeLessonLink(encodeLessonLink(empty))).toEqual(empty);
  });

  it("boşluklu yapıştırmayı tolere eder", () => {
    expect(decodeLessonLink(`  ${encodeLessonLink(lesson)}\n`)).toEqual(lesson);
  });

  it.each(["", "bozuk!!", "lingualink://import?d=", "e30", "lingualink://import?d=@@@"])(
    "geçersiz girdiyi reddeder: %s",
    (input) => {
      expect(decodeLessonLink(input)).toBeNull();
    },
  );

  it("metin dışına taşan konumu reddeder", () => {
    const bad = { ...lesson, pairs: [{ ...pairs[0], source: span(0, 0, 99, "Günaydı") } as MappedPair] };
    expect(decodeLessonLink(encodeRaw(bad))).toBeNull();
  });

  it("örtüşen çiftleri reddeder", () => {
    const overlapping = [pairs[0], { ...pairs[1], source: span(1, 3, 8, "aydın") } as MappedPair];
    expect(decodeLessonLink(encodeRaw({ ...lesson, pairs: overlapping }))).toBeNull();
  });

  it("aynı dil çiftini ve sınırı aşan metni reddeder", () => {
    expect(decodeLessonLink(encodeRaw({ ...lesson, nativeLanguage: "tr" }))).toBeNull();
    expect(
      decodeLessonLink(
        encodeRaw({ ...lesson, pairs: [], sourceText: "a".repeat(MAX_SOURCE_TEXT_LENGTH + 1) }),
      ),
    ).toBeNull();
  });
});
