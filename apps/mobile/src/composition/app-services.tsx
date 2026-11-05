import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { IAiGateway } from "../features/alignment/domain/ai-gateway";
import type { ILessonRepository } from "../features/lessons/domain/lesson-repository";
import type { ISpeechService } from "../features/speech/domain/speech-service";

export type AppServices = {
  lessons: ILessonRepository;
  ai: IAiGateway;
  speech: ISpeechService;
  shareText(message: string): Promise<void>;
  newId(): string;
  now(): Date;
  random(): number;
};

const ServicesContext = createContext<AppServices | null>(null);

export function ServicesProvider({ services, children }: { services: AppServices; children: ReactNode }) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): AppServices {
  const services = useContext(ServicesContext);
  if (!services) throw new Error("ServicesProvider eksik");
  return services;
}
