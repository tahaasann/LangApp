import { z } from "zod";

export const EntitlementTierSchema = z.enum(["free", "pro", "lifetime"]);
export type EntitlementTier = z.infer<typeof EntitlementTierSchema>;
