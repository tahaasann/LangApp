import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import type { Lesson, MappedPair } from "@lingualink/contracts";
import { useServices } from "../../../composition/app-services";
import { PairWorkspace } from "../../../shared/pair-workspace";
import { Button, Card, Chip, Message, screen } from "../../../shared/ui";
import { encodeLessonLink } from "../../sharing/domain/lesson-share-codec";
import type { LessonGroup } from "../domain/lesson-repository";

export function LessonDetailScreen({ lessonId, onDeleted }: { lessonId: string; onDeleted: () => void }) {
  const services = useServices();
  const [lesson, setLesson] = useState<Lesson | null | undefined>(undefined);
  const [groups, setGroups] = useState<LessonGroup[]>([]);
  const [editing, setEditing] = useState(false);
  const [draftPairs, setDraftPairs] = useState<MappedPair[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [nextLesson, nextGroups] = await Promise.all([
        services.lessons.get(lessonId),
        services.lessons.listGroups(),
      ]);
      setLesson(nextLesson);
      setGroups(nextGroups);
    } catch {
      setError("Ders yüklenemedi.");
    }
  }, [lessonId, services.lessons]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => () => services.speech.stop(), [services.speech]);

  if (error && !lesson) {
    return (
      <View style={screen.container}>
        <Message tone="danger" text={error} />
      </View>
    );
  }
  if (lesson === undefined) return <View style={screen.container} />;
  if (lesson === null) {
    return (
      <View style={screen.container}>
        <Message text="Bu ders bulunamadı." />
      </View>
    );
  }

  const persist = async (next: Lesson) => {
    try {
      const updated = { ...next, updatedAt: services.now().toISOString() };
      await services.lessons.save(updated);
      setLesson(updated);
      setError(null);
      return true;
    } catch {
      setError("Değişiklik kaydedilemedi.");
      return false;
    }
  };

  const startEditing = () => {
    setDraftPairs([...lesson.pairs]);
    setEditing(true);
  };

  const saveEditing = async () => {
    if (await persist({ ...lesson, pairs: draftPairs })) setEditing(false);
  };

  const share = async () => {
    try {
      await services.shareText(`"${lesson.title}" dersini LinguaLink'te aç:\n${encodeLessonLink(lesson)}`);
    } catch {
      setError("Paylaşım açılamadı.");
    }
  };

  const confirmDelete = () => {
    Alert.alert("Ders silinsin mi?", "Bu işlem geri alınamaz.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          void services.lessons
            .delete(lesson.id)
            .then(onDeleted)
            .catch(() => setError("Ders silinemedi."));
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={screen.container}>
      <Text style={screen.title}>{lesson.title}</Text>
      <Card>
        <PairWorkspace
          sourceText={lesson.sourceText}
          targetText={lesson.targetText}
          pairs={editing ? draftPairs : lesson.pairs}
          learningLanguage={lesson.learningLanguage}
          {...(editing ? { onChange: setDraftPairs } : {})}
        />
      </Card>
      {!editing && lesson.pairs.length === 0 ? (
        <Message text="Bu derste eşleştirme yok. Düzenleyerek ekleyebilirsiniz." />
      ) : null}
      {error ? <Message tone="danger" text={error} /> : null}

      {editing ? (
        <View style={screen.row}>
          <Button label="Değişiklikleri kaydet" onPress={saveEditing} />
          <Button label="Vazgeç" variant="secondary" onPress={() => setEditing(false)} />
        </View>
      ) : (
        <View style={screen.row}>
          <Button
            label="Tümünü dinle"
            onPress={() => services.speech.speak(lesson.sourceText, lesson.learningLanguage)}
          />
          <Button label="Eşleştirmeyi düzenle" variant="secondary" onPress={startEditing} />
          <Button label="Paylaş" variant="secondary" onPress={share} />
          <Button label="Dersi sil" variant="danger" onPress={confirmDelete} />
        </View>
      )}

      {groups.length > 0 && !editing ? (
        <View style={screen.row}>
          <Chip
            label="Grupsuz"
            selected={lesson.groupId === null}
            onPress={() => void persist({ ...lesson, groupId: null })}
          />
          {groups.map((group) => (
            <Chip
              key={group.id}
              label={group.name}
              selected={lesson.groupId === group.id}
              onPress={() => void persist({ ...lesson, groupId: group.id })}
            />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
