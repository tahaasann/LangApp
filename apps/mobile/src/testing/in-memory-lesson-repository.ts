import type { Lesson } from "@lingualink/contracts";
import type { ILessonRepository, LessonGroup } from "../features/lessons/domain/lesson-repository";

export class InMemoryLessonRepository implements ILessonRepository {
  readonly lessons = new Map<string, Lesson>();
  readonly groups = new Map<string, LessonGroup>();

  async list() {
    return [...this.lessons.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string) {
    return this.lessons.get(id) ?? null;
  }

  async save(lesson: Lesson) {
    this.lessons.set(lesson.id, lesson);
  }

  async delete(id: string) {
    this.lessons.delete(id);
  }

  async listGroups() {
    return [...this.groups.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async saveGroup(group: LessonGroup) {
    this.groups.set(group.id, group);
  }

  async deleteGroup(id: string) {
    this.groups.delete(id);
    for (const lesson of this.lessons.values()) {
      if (lesson.groupId === id) this.lessons.set(lesson.id, { ...lesson, groupId: null });
    }
  }
}
