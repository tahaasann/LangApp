import { router } from "expo-router";
import { CreateLessonScreen } from "../../features/lessons/presentation/create-lesson-screen";

export default function CreateRoute() {
  return <CreateLessonScreen onSaved={(id) => router.push(`/lesson/${id}`)} />;
}
