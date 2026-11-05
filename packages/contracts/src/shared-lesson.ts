import { z } from "zod";
import { MAX_SOURCE_TEXT_LENGTH, MAX_TARGET_TEXT_LENGTH } from "./ai-api.ts";
import { LanguageCodeSchema } from "./language-code.ts";

const PositionSchema = z.number().int().nonnegative();

/** Paylaşım bağlantısının içeriği. Dışarıdan geldiği için konumlar ayrıca metne göre doğrulanır. */
export const SharedLessonPayloadSchema = z.strictObject({
  v: z.literal(1),
  title: z.string().trim().min(1).max(200),
  learning: LanguageCodeSchema,
  native: LanguageCodeSchema,
  source: z.string().min(1).max(MAX_SOURCE_TEXT_LENGTH),
  target: z.string().min(1).max(MAX_TARGET_TEXT_LENGTH),
  /** Her çift: [kaynak başı, kaynak sonu, hedef başı, hedef sonu] */
  pairs: z.array(z.tuple([PositionSchema, PositionSchema, PositionSchema, PositionSchema])),
});
export type SharedLessonPayload = z.infer<typeof SharedLessonPayloadSchema>;
