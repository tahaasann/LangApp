import * as Speech from "expo-speech";
import type { ISpeechService } from "../domain/speech-service";

export const expoSpeechService: ISpeechService = {
  speak(text, language) {
    void Speech.stop();
    Speech.speak(text, { language });
  },
  stop() {
    void Speech.stop();
  },
};
