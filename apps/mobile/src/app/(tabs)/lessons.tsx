import { router } from "expo-router";
import { LessonsScreen } from "../../features/lessons/presentation/lessons-screen";
import { useFocusKey } from "../../shared/use-focus-key";

export default function LessonsRoute() {
  const refreshKey = useFocusKey();
  return (
    <LessonsScreen
      refreshKey={refreshKey}
      onOpen={(id) => router.push(`/lesson/${id}`)}
      onImport={() => router.push("/import")}
    />
  );
}
