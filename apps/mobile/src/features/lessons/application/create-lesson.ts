import { LessonSchema } from "@lingualink/contracts";
import type { LanguageCode, Lesson, MappedPair } from "@lingualink/contracts";
import type { ILessonRepository } from "../domain/lesson-repository";

export type LessonDraft = {
  title: string;
  learningLanguage: LanguageCode;
  nativeLanguage: LanguageCode;
  sourceText: string;
  targetText: string;
  pairs: readonly MappedPair[];
  groupId?: string | null;
};

export type CreateLessonDeps = {
  repository: Pick<ILessonRepository, "save">;
  newId: () => string;
  now: () => Date;
};

export type LessonDraftErrorCode = "EMPTY_TEXT" | "SAME_LANGUAGE";

export class LessonDraftError extends Error {
  readonly code: LessonDraftErrorCode;

  constructor(code: LessonDraftErrorCode) {
    super(code);
    this.code = code;
  }
}

const MAX_TITLE_LENGTH = 40;

export function defaultTitle(sourceText: string): string {
  const text = sourceText.trim().replace(/\s+/g, " ");
  if (text.length <= MAX_TITLE_LENGTH) return text;
  const cut = text.slice(0, MAX_TITLE_LENGTH);
  const boundary = cut.lastIndexOf(" ");
  return `${boundary > 0 ? cut.slice(0, boundary) : cut}…`;
}

export async function createLesson(deps: CreateLessonDeps, draft: LessonDraft): Promise<Lesson> {
  if (draft.sourceText.trim() === "" || draft.targetText.trim() === "") {
    throw new LessonDraftError("EMPTY_TEXT");
  }
  if (draft.learningLanguage === draft.nativeLanguage) throw new LessonDraftError("SAME_LANGUAGE");

  const timestamp = deps.now().toISOString();
  const lesson = LessonSchema.parse({
    id: deps.newId(),
    title: draft.title.trim() || defaultTitle(draft.sourceText),
    learningLanguage: draft.learningLanguage,
    nativeLanguage: draft.nativeLanguage,
    sourceText: draft.sourceText,
    targetText: draft.targetText,
    pairs: draft.pairs,
    groupId: draft.groupId ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  await deps.repository.save(lesson);
  return lesson;
}
