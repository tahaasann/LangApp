/** Gerçek SQL, Node'un yerleşik SQLite'ı üzerinde çalıştırılır. */
import { DatabaseSync } from "node:sqlite";
import type { Lesson } from "@lingualink/contracts";
import { SqliteLessonRepository } from "./sqlite-lesson-repository";
import type { SqlDriver } from "./sqlite-lesson-repository";

function nodeDriver(): SqlDriver {
  const db = new DatabaseSync(":memory:");
  return {
    execAsync: async (sql) => {
      db.exec(sql);
    },
    runAsync: async (sql, params) => {
      db.prepare(sql).run(...(params as never[]));
    },
    getAllAsync: async <Row,>(sql: string, params: readonly (string | number | null)[]) =>
      db.prepare(sql).all(...(params as never[])) as Row[],
    withTransactionAsync: async (task) => {
      db.exec("BEGIN");
      try {
        await task();
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

const lesson = (id: string, createdAt = "2026-11-05T10:00:00.000Z"): Lesson => ({
  id,
  title: `Ders ${id}`,
  learningLanguage: "en",
  nativeLanguage: "tr",
  sourceText: "Good morning",
  targetText: "Gün aydın",
  groupId: null,
  createdAt,
  updatedAt: createdAt,
  pairs: [
    {
      order: 0,
      source: { pairOrder: 0, start: 0, end: 4, text: "Good", color: "#E74C3C" },
      target: { pairOrder: 0, start: 0, end: 3, text: "Gün", color: "#E74C3C" },
    },
    {
      order: 1,
      source: { pairOrder: 1, start: 5, end: 12, text: "morning", color: "#9B59B6" },
      target: { pairOrder: 1, start: 4, end: 9, text: "aydın", color: "#9B59B6" },
    },
  ],
});

async function setup() {
  const driver = nodeDriver();
  const repository = new SqliteLessonRepository(driver);
  await repository.migrate();
  return { driver, repository };
}

describe("SqliteLessonRepository", () => {
  it("dersi çiftleriyle kaydedip aynen okur", async () => {
    const { repository } = await setup();
    await repository.save(lesson("a"));
    expect(await repository.get("a")).toEqual(lesson("a"));
  });

  it("bilinmeyen ders için null döner", async () => {
    const { repository } = await setup();
    expect(await repository.get("yok")).toBeNull();
  });

  it("dersleri yeniden eskiye sıralar", async () => {
    const { repository } = await setup();
    await repository.save(lesson("eski", "2026-01-01T00:00:00.000Z"));
    await repository.save(lesson("yeni", "2026-06-01T00:00:00.000Z"));
    expect((await repository.list()).map((item) => item.id)).toEqual(["yeni", "eski"]);
  });

  it("yeniden kaydetmede eski çiftleri değiştirir", async () => {
    const { repository } = await setup();
    await repository.save(lesson("a"));
    await repository.save({ ...lesson("a"), title: "Yeni", pairs: lesson("a").pairs.slice(0, 1) });
    const saved = await repository.get("a");
    expect(saved?.title).toBe("Yeni");
    expect(saved?.pairs).toHaveLength(1);
  });

  it("silince çiftleriyle kaldırır", async () => {
    const { driver, repository } = await setup();
    await repository.save(lesson("a"));
    await repository.delete("a");
    expect(await repository.get("a")).toBeNull();
    expect(await driver.getAllAsync("SELECT * FROM alignment_pairs", [])).toEqual([]);
  });

  it("kaydetme başarısızsa eski dersi korur", async () => {
    const { repository } = await setup();
    await repository.save(lesson("a"));
    const broken = lesson("a");
    broken.pairs = [broken.pairs[0]!, broken.pairs[0]!];
    await expect(repository.save({ ...broken, title: "Bozuk" })).rejects.toThrow();
    expect((await repository.get("a"))?.title).toBe("Ders a");
  });

  it("grupları yönetir ve silinen grubun derslerini gruptan çıkarır", async () => {
    const { repository } = await setup();
    await repository.saveGroup({ id: "g", name: "Seyahat" });
    await repository.saveGroup({ id: "h", name: "Araba" });
    expect((await repository.listGroups()).map((group) => group.name)).toEqual(["Araba", "Seyahat"]);

    await repository.save({ ...lesson("a"), groupId: "g" });
    expect((await repository.get("a"))?.groupId).toBe("g");

    await repository.deleteGroup("g");
    expect((await repository.get("a"))?.groupId).toBeNull();
    expect((await repository.listGroups()).map((group) => group.id)).toEqual(["h"]);
  });

  it("migrasyon tekrar çalıştırılabilir", async () => {
    const { repository } = await setup();
    await repository.save(lesson("a"));
    await repository.migrate();
    expect(await repository.get("a")).not.toBeNull();
  });
});
