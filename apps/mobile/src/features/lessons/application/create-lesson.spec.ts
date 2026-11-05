import { createLesson, defaultTitle, LessonDraftError } from "./create-lesson";
import { InMemoryLessonRepository } from "../../../testing/in-memory-lesson-repository";

const deps = () => ({
  repository: new InMemoryLessonRepository(),
  newId: () => "id-1",
  now: () => new Date("2026-11-05T10:00:00.000Z"),
});
const draft = {
  title: "Selam",
  learningLanguage: "en",
  nativeLanguage: "tr",
  sourceText: "Hello",
  targetText: "Merhaba",
  pairs: [],
} as const;

describe("createLesson", () => {
  it("dersi kaydeder ve döndürür", async () => {
    const services = deps();
    const lesson = await createLesson(services, draft);
    expect(lesson).toMatchObject({ id: "id-1", title: "Selam", groupId: null, createdAt: "2026-11-05T10:00:00.000Z" });
    expect(await services.repository.get("id-1")).toEqual(lesson);
  });

  it("başlık boşsa metinden üretir", async () => {
    const lesson = await createLesson(deps(), { ...draft, title: "  " });
    expect(lesson.title).toBe("Hello");
  });

  it("metinleri ve başlığı kırpar", async () => {
    const lesson = await createLesson(deps(), { ...draft, title: " A ", sourceText: "Hello" });
    expect(lesson.title).toBe("A");
  });

  it.each([
    ["boş kaynak", { sourceText: " " }, "EMPTY_TEXT"],
    ["boş çeviri", { targetText: "" }, "EMPTY_TEXT"],
    ["aynı dil", { nativeLanguage: "en" as const }, "SAME_LANGUAGE"],
  ])("%s kaydedilmez", async (_name, change, code) => {
    const services = deps();
    await expect(createLesson(services, { ...draft, ...change })).rejects.toMatchObject({ code });
    await expect(createLesson(services, { ...draft, ...change })).rejects.toBeInstanceOf(LessonDraftError);
    expect(await services.repository.list()).toEqual([]);
  });
});

describe("defaultTitle", () => {
  it("kısa metni aynen kullanır", () => {
    expect(defaultTitle(" Hello  world ")).toBe("Hello world");
  });

  it("uzun metni kelime sınırında keser", () => {
    const title = defaultTitle("word ".repeat(30));
    expect(title.length).toBeLessThanOrEqual(41);
    expect(title.endsWith("word…")).toBe(true);
  });

  it("boşluksuz uzun metni karakterden keser", () => {
    expect(defaultTitle("あ".repeat(60))).toBe(`${"あ".repeat(40)}…`);
  });
});
