import type { AppServices } from "../composition/app-services";
import { InMemoryLessonRepository } from "./in-memory-lesson-repository";

export function fakeServices() {
  let nextId = 0;
  const repository = new InMemoryLessonRepository();
  const ai = {
    align: jest.fn<ReturnType<AppServices["ai"]["align"]>, Parameters<AppServices["ai"]["align"]>>(),
    translate: jest.fn<ReturnType<AppServices["ai"]["translate"]>, Parameters<AppServices["ai"]["translate"]>>(),
    generate: jest.fn<ReturnType<AppServices["ai"]["generate"]>, Parameters<AppServices["ai"]["generate"]>>(),
  };
  const speech = { speak: jest.fn(), stop: jest.fn() };
  const shareText = jest.fn<Promise<void>, [string]>(async () => undefined);
  const services: AppServices = {
    lessons: repository,
    ai,
    speech,
    shareText,
    newId: () => `id-${(nextId += 1)}`,
    now: () => new Date("2026-11-05T10:00:00.000Z"),
    random: () => 0.42,
  };
  return { services, repository, ai, speech, shareText };
}
