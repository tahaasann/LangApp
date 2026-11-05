import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

/** Ekran her odaklandığında değişir; listeler bununla yenilenir. */
export function useFocusKey(): number {
  const [key, setKey] = useState(0);
  useFocusEffect(useCallback(() => setKey((value) => value + 1), []));
  return key;
}
