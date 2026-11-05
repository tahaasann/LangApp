import { router, useLocalSearchParams } from "expo-router";
import { ImportLessonScreen } from "../features/sharing/presentation/import-lesson-screen";

export default function ImportRoute() {
  const { d } = useLocalSearchParams<{ d?: string }>();
  return (
    <ImportLessonScreen
      {...(d ? { code: d } : {})}
      onImported={(id) => router.replace(`/lesson/${id}`)}
    />
  );
}
