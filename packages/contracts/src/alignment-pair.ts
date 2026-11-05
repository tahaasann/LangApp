import { z } from "zod";

/**
 * AI çıktısındaki tek ifade çifti.
 * `source` öğrenilen dildeki, `target` ana dildeki alt dizgidir.
 * Konum ve renk uygulama tarafından hesaplanır (docs/SPAN_MAPPING.md).
 */
export const AlignmentPairSchema = z.strictObject({
  order: z.number().int().nonnegative(),
  source: z.string().min(1),
  target: z.string().min(1),
});
export type AlignmentPair = z.infer<typeof AlignmentPairSchema>;
