import { LessonSchema } from "@lingualink/contracts";
import type { Lesson } from "@lingualink/contracts";
import type { ILessonRepository, LessonGroup } from "../domain/lesson-repository";

export type SqlValue = string | number | null;

/** expo-sqlite veritabanının kullanılan alt kümesi; testlerde Node SQLite ile karşılanır. */
export type SqlDriver = {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: readonly SqlValue[]): Promise<unknown>;
  getAllAsync<Row>(sql: string, params: readonly SqlValue[]): Promise<Row[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
};

type LessonRow = {
  id: string;
  title: string;
  learning_language: string;
  native_language: string;
  source_text: string;
  target_text: string;
  group_id: string | null;
  created_at: string;
  updated_at: string;
};

type PairRow = {
  lesson_id: string;
  pair_order: number;
  source_phrase: string;
  target_phrase: string;
  source_start: number;
  source_end: number;
  target_start: number;
  target_end: number;
  color: string;
};

const SCHEMA = `
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS lesson_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    learning_language TEXT NOT NULL,
    native_language TEXT NOT NULL,
    source_text TEXT NOT NULL,
    target_text TEXT NOT NULL,
    group_id TEXT REFERENCES lesson_groups(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS alignment_pairs (
    lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    pair_order INTEGER NOT NULL,
    source_phrase TEXT NOT NULL,
    target_phrase TEXT NOT NULL,
    source_start INTEGER NOT NULL,
    source_end INTEGER NOT NULL,
    target_start INTEGER NOT NULL,
    target_end INTEGER NOT NULL,
    color TEXT NOT NULL,
    PRIMARY KEY (lesson_id, pair_order)
  );
`;

function toLesson(row: LessonRow, pairs: readonly PairRow[]): Lesson {
  return LessonSchema.parse({
    id: row.id,
    title: row.title,
    learningLanguage: row.learning_language,
    nativeLanguage: row.native_language,
    sourceText: row.source_text,
    targetText: row.target_text,
    groupId: row.group_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pairs: pairs.map((pair) => ({
      order: pair.pair_order,
      source: {
        pairOrder: pair.pair_order,
        start: pair.source_start,
        end: pair.source_end,
        text: pair.source_phrase,
        color: pair.color,
      },
      target: {
        pairOrder: pair.pair_order,
        start: pair.target_start,
        end: pair.target_end,
        text: pair.target_phrase,
        color: pair.color,
      },
    })),
  });
}

export class SqliteLessonRepository implements ILessonRepository {
  private readonly db: SqlDriver;

  constructor(db: SqlDriver) {
    this.db = db;
  }

  async migrate(): Promise<void> {
    await this.db.execAsync(SCHEMA);
  }

  async list(): Promise<Lesson[]> {
    const rows = await this.db.getAllAsync<LessonRow>(
      "SELECT * FROM lessons ORDER BY created_at DESC, id DESC",
      [],
    );
    const pairs = await this.db.getAllAsync<PairRow>(
      "SELECT * FROM alignment_pairs ORDER BY lesson_id, pair_order",
      [],
    );
    const byLesson = new Map<string, PairRow[]>();
    for (const pair of pairs) {
      const list = byLesson.get(pair.lesson_id);
      if (list) list.push(pair);
      else byLesson.set(pair.lesson_id, [pair]);
    }
    return rows.map((row) => toLesson(row, byLesson.get(row.id) ?? []));
  }

  async get(id: string): Promise<Lesson | null> {
    const [row] = await this.db.getAllAsync<LessonRow>("SELECT * FROM lessons WHERE id = ?", [id]);
    if (!row) return null;
    const pairs = await this.db.getAllAsync<PairRow>(
      "SELECT * FROM alignment_pairs WHERE lesson_id = ? ORDER BY pair_order",
      [id],
    );
    return toLesson(row, pairs);
  }

  async save(lesson: Lesson): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `INSERT INTO lessons (id, title, learning_language, native_language, source_text, target_text, group_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           learning_language = excluded.learning_language,
           native_language = excluded.native_language,
           source_text = excluded.source_text,
           target_text = excluded.target_text,
           group_id = excluded.group_id,
           updated_at = excluded.updated_at`,
        [
          lesson.id,
          lesson.title,
          lesson.learningLanguage,
          lesson.nativeLanguage,
          lesson.sourceText,
          lesson.targetText,
          lesson.groupId,
          lesson.createdAt,
          lesson.updatedAt,
        ],
      );
      await this.db.runAsync("DELETE FROM alignment_pairs WHERE lesson_id = ?", [lesson.id]);
      for (const pair of lesson.pairs) {
        await this.db.runAsync(
          `INSERT INTO alignment_pairs (lesson_id, pair_order, source_phrase, target_phrase, source_start, source_end, target_start, target_end, color)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            lesson.id,
            pair.order,
            pair.source.text,
            pair.target.text,
            pair.source.start,
            pair.source.end,
            pair.target.start,
            pair.target.end,
            pair.source.color,
          ],
        );
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.runAsync("DELETE FROM lessons WHERE id = ?", [id]);
  }

  async listGroups(): Promise<LessonGroup[]> {
    return this.db.getAllAsync<LessonGroup>("SELECT id, name FROM lesson_groups ORDER BY name", []);
  }

  async saveGroup(group: LessonGroup): Promise<void> {
    await this.db.runAsync(
      "INSERT INTO lesson_groups (id, name) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name",
      [group.id, group.name],
    );
  }

  async deleteGroup(id: string): Promise<void> {
    await this.db.runAsync("DELETE FROM lesson_groups WHERE id = ?", [id]);
  }
}
