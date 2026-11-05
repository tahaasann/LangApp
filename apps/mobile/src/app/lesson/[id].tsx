import { router, useLocalSearchParams } from "expo-router";
import { LessonDetailScreen } from "../../features/lessons/presentation/lesson-detail-screen";

export default function LessonRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LessonDetailScreen lessonId={id} onDeleted={() => router.back()} />;
}
