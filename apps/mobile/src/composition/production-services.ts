import { openDatabaseAsync } from "expo-sqlite";
import { Share } from "react-native";
import { HttpAiGateway } from "../features/alignment/infrastructure/http-ai-gateway";
import { SqliteLessonRepository } from "../features/lessons/infrastructure/sqlite-lesson-repository";
import { expoSpeechService } from "../features/speech/infrastructure/expo-speech-service";
import type { AppServices } from "./app-services";

/** Emülatörde 10.0.2.2, geliştirme makinesinin 127.0.0.1 adresidir. */
const AI_BASE_URL = process.env.EXPO_PUBLIC_AI_BASE_URL ?? "http://10.0.2.2:8787";

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Composition root: adaptörler yalnızca burada bağlanır. */
export async function createProductionServices(): Promise<AppServices> {
  const db = await openDatabaseAsync("lingualink.db");
  const lessons = new SqliteLessonRepository({
    execAsync: (sql) => db.execAsync(sql),
    runAsync: (sql, params) => db.runAsync(sql, [...params]),
    getAllAsync: (sql, params) => db.getAllAsync(sql, [...params]),
    withTransactionAsync: (task) => db.withTransactionAsync(task),
  });
  await lessons.migrate();
  return {
    lessons,
    ai: new HttpAiGateway(AI_BASE_URL),
    speech: expoSpeechService,
    shareText: async (message) => {
      await Share.share({ message });
    },
    newId,
    now: () => new Date(),
    random: Math.random,
  };
}
