import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Lesson } from "@lingualink/contracts";
import { useServices } from "../../../composition/app-services";
import { LANGUAGE_NAMES } from "../../../shared/languages";
import { Button, Card, Chip, Field, Message, palette, screen } from "../../../shared/ui";
import type { LessonGroup } from "../domain/lesson-repository";

const ALL = "__all__";

export function LessonsScreen({
  refreshKey,
  onOpen,
  onImport,
}: {
  refreshKey: number;
  onOpen: (lessonId: string) => void;
  onImport: () => void;
}) {
  const services = useServices();
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [groups, setGroups] = useState<LessonGroup[]>([]);
  const [filter, setFilter] = useState(ALL);
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [nextLessons, nextGroups] = await Promise.all([
        services.lessons.list(),
        services.lessons.listGroups(),
      ]);
      setLessons(nextLessons);
      setGroups(nextGroups);
      setError(null);
    } catch {
      setError("Dersler yüklenemedi.");
    }
  }, [services.lessons]);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  const addGroup = async () => {
    const name = groupName.trim();
    if (!name) return;
    try {
      await services.lessons.saveGroup({ id: services.newId(), name });
      setGroupName("");
      await reload();
    } catch {
      setError("Grup oluşturulamadı.");
    }
  };

  const deleteFilteredGroup = async () => {
    try {
      await services.lessons.deleteGroup(filter);
      setFilter(ALL);
      await reload();
    } catch {
      setError("Grup silinemedi.");
    }
  };

  const visible = (lessons ?? []).filter((lesson) => filter === ALL || lesson.groupId === filter);

  return (
    <ScrollView contentContainerStyle={screen.container} keyboardShouldPersistTaps="handled">
      <View style={screen.row}>
        <Chip label="Tümü" selected={filter === ALL} onPress={() => setFilter(ALL)} />
        {groups.map((group) => (
          <Chip key={group.id} label={group.name} selected={filter === group.id} onPress={() => setFilter(group.id)} />
        ))}
      </View>
      <Field label="Yeni grup" placeholder="Örn. Seyahat" value={groupName} maxLength={40} onChangeText={setGroupName} />
      <View style={screen.row}>
        <Button label="Grup ekle" variant="secondary" disabled={groupName.trim() === ""} onPress={addGroup} />
        {filter !== ALL ? <Button label="Bu grubu sil" variant="secondary" onPress={deleteFilteredGroup} /> : null}
        <Button label="Bağlantıyla ders al" variant="secondary" onPress={onImport} />
      </View>

      {error ? <Message tone="danger" text={error} /> : null}
      {lessons !== null && visible.length === 0 ? (
        <Message text={filter === ALL ? "Henüz ders yok. Oluştur sekmesinden başlayın." : "Bu grupta ders yok."} />
      ) : null}
      {visible.map((lesson) => (
        <Pressable key={lesson.id} accessibilityRole="button" onPress={() => onOpen(lesson.id)}>
          <Card>
            <Text style={styles.title}>{lesson.title}</Text>
            <Text numberOfLines={2} style={styles.preview}>
              {lesson.sourceText}
            </Text>
            <Text style={styles.meta}>
              {LANGUAGE_NAMES[lesson.learningLanguage]} → {LANGUAGE_NAMES[lesson.nativeLanguage]} · {lesson.pairs.length} çift
            </Text>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: "700", color: palette.text },
  preview: { fontSize: 14, color: palette.text },
  meta: { fontSize: 12, color: palette.muted },
});
