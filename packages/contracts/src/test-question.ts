import { z } from "zod";

export const TestQuestionTypeSchema = z.enum(["word", "sentence", "paragraph"]);
export type TestQuestionType = z.infer<typeof TestQuestionTypeSchema>;

export const TestQuestionSchema = z
  .strictObject({
    type: TestQuestionTypeSchema,
    prompt: z.string().min(1),
    choices: z.array(z.string().min(1)).length(4),
    correctIndex: z.number().int().min(0).max(3),
  })
  .refine((question) => new Set(question.choices).size === question.choices.length, {
    error: "Şıklar birbirinden farklı olmalı",
    path: ["choices"],
  });
export type TestQuestion = z.infer<typeof TestQuestionSchema>;
