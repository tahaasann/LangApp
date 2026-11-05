import type { Lesson } from "@lingualink/contracts";

export type LessonGroup = { id: string; name: string };

export interface ILessonRepository {
  list(): Promise<Lesson[]>;
  get(id: string): Promise<Lesson | null>;
  save(lesson: Lesson): Promise<void>;
  delete(id: string): Promise<void>;
  listGroups(): Promise<LessonGroup[]>;
  saveGroup(group: LessonGroup): Promise<void>;
  /** Grubun dersleri silinmez, gruptan çıkar. */
  deleteGroup(id: string): Promise<void>;
}
