import { SharedLessonPayloadSchema } from "@lingualink/contracts";
import type { Lesson, MappedPair } from "@lingualink/contracts";
import { colorForOrder } from "../../alignment/domain/map-pairs-to-spans";
import { hasOverlaps } from "../../alignment/domain/pair-editor";

export type SharedLesson = Pick<
  Lesson,
  "title" | "learningLanguage" | "nativeLanguage" | "sourceText" | "targetText" | "pairs"
>;

const LINK_PREFIX = "lingualink://import?d=";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function toBase64Url(text: string): string {
  const bytes = encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_match, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes.charCodeAt(index);
    const b = bytes.charCodeAt(index + 1);
    const c = bytes.charCodeAt(index + 2);
    const word = (a << 16) | ((b || 0) << 8) | (c || 0);
    const remaining = bytes.length - index;
    output += ALPHABET.charAt((word >> 18) & 63) + ALPHABET.charAt((word >> 12) & 63);
    if (remaining > 1) output += ALPHABET.charAt((word >> 6) & 63);
    if (remaining > 2) output += ALPHABET.charAt(word & 63);
  }
  return output;
}

function fromBase64Url(code: string): string | null {
  let bytes = "";
  let buffer = 0;
  let bits = 0;
  for (const character of code) {
    const value = ALPHABET.indexOf(character);
    if (value === -1) return null;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes += `%${((buffer >> bits) & 255).toString(16).padStart(2, "0")}`;
      buffer &= (1 << bits) - 1;
    }
  }
  try {
    return decodeURIComponent(bytes);
  } catch {
    return null;
  }
}

export function encodeLessonLink(lesson: SharedLesson): string {
  const payload = {
    v: 1,
    title: lesson.title,
    learning: lesson.learningLanguage,
    native: lesson.nativeLanguage,
    source: lesson.sourceText,
    target: lesson.targetText,
    pairs: lesson.pairs.map((pair) => [pair.source.start, pair.source.end, pair.target.start, pair.target.end]),
  };
  return `${LINK_PREFIX}${toBase64Url(JSON.stringify(payload))}`;
}

const inBounds = (start: number, end: number, text: string) => start < end && end <= text.length;

/** Bağlantı dışarıdan geldiği için güvenilmez kabul edilir; geçersizse `null`. */
export function decodeLessonLink(input: string): SharedLesson | null {
  const trimmed = input.trim();
  const code = trimmed.startsWith(LINK_PREFIX) ? trimmed.slice(LINK_PREFIX.length) : trimmed;
  if (!code) return null;

  const json = fromBase64Url(code);
  if (json === null) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  const parsed = SharedLessonPayloadSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { title, learning, native, source, target, pairs: positions } = parsed.data;
  if (learning === native) return null;

  const pairs: MappedPair[] = [];
  for (const [order, [sourceStart, sourceEnd, targetStart, targetEnd]] of positions.entries()) {
    if (!inBounds(sourceStart, sourceEnd, source) || !inBounds(targetStart, targetEnd, target)) return null;
    const color = colorForOrder(order);
    pairs.push({
      order,
      source: { pairOrder: order, start: sourceStart, end: sourceEnd, text: source.slice(sourceStart, sourceEnd), color },
      target: { pairOrder: order, start: targetStart, end: targetEnd, text: target.slice(targetStart, targetEnd), color },
    });
  }
  if (hasOverlaps(pairs)) return null;

  return { title, learningLanguage: learning, nativeLanguage: native, sourceText: source, targetText: target, pairs };
}
