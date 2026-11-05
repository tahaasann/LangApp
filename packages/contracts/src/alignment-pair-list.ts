import { z } from "zod";
import { AlignmentPairSchema } from "./alignment-pair.ts";

export const AlignmentPairListSchema = z.strictObject({
  pairs: z.array(AlignmentPairSchema),
});
export type AlignmentPairList = z.infer<typeof AlignmentPairListSchema>;

/** Renk `order % HIGHLIGHT_PALETTE.length` ile atanır. */
export const HIGHLIGHT_PALETTE = [
  "#E74C3C",
  "#9B59B6",
  "#3498DB",
  "#1ABC9C",
  "#2ECC71",
  "#F1C40F",
  "#E67E22",
  "#E91E63",
  "#34495E",
  "#7F8C8D",
  "#16A085",
  "#27AE60",
  "#2980B9",
  "#8E44AD",
  "#2C3E50",
  "#F39C12",
  "#D35400",
  "#BDC3C7",
  "#C0392B",
  "#7E57C2",
  "#26A69A",
  "#EC407A",
  "#5C6BC0",
  "#66BB6A",
] as const;
