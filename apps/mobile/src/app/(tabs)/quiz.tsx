import { QuizScreen } from "../../features/tests/presentation/quiz-screen";
import { useFocusKey } from "../../shared/use-focus-key";

export default function QuizRoute() {
  return <QuizScreen refreshKey={useFocusKey()} />;
}
