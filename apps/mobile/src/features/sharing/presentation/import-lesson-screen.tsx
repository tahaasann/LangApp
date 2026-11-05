import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text } from "react-native";
import { useServices } from "../../../composition/app-services";
import { PairWorkspace } from "../../../shared/pair-workspace";
import { Button, Card, Field, Message, screen } from "../../../shared/ui";
import { createLesson } from "../../lessons/application/create-lesson";
import { decodeLessonLink } from "../domain/lesson-share-codec";

export function ImportLessonScreen({
  code,
  onImported,
}: {
  code?: string;
  onImported: (lessonId: string) => void;
}) {
  const services = useServices();
  const [input, setInput] = useState(code ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (code) setInput(code);
  }, [code]);

  const lesson = useMemo(() => decodeLessonLink(input), [input]);
  const invalid = input.trim() !== "" && lesson === null;

  const save = async () => {
    if (!lesson) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await createLesson(
        { repository: services.lessons, newId: services.newId, now: services.now },
        lesson,
      );
      onImported(saved.id);
    } catch {
      setError("Ders kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={screen.container} keyboardShouldPersistTaps="handled">
      <Field
        label="Paylaşım bağlantısı"
        placeholder="lingualink://import?d=…"
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        value={input}
        onChangeText={setInput}
      />
      {invalid ? <Message tone="danger" text="Bu bağlantı geçersiz veya bozuk." /> : null}
      {lesson ? (
        <Card>
          <Text style={screen.title}>{lesson.title}</Text>
          <PairWorkspace
            sourceText={lesson.sourceText}
            targetText={lesson.targetText}
            pairs={lesson.pairs}
            learningLanguage={lesson.learningLanguage}
          />
          <Button label="Derslerime ekle" disabled={saving} onPress={save} />
        </Card>
      ) : null}
      {error ? <Message tone="danger" text={error} /> : null}
    </ScrollView>
  );
}
