import { useEffect, useRef, useState } from "react";
import type { ComponentRef } from "react";
import { ScrollView, View } from "react-native";
import { MAX_SOURCE_TEXT_LENGTH, MAX_TARGET_TEXT_LENGTH, MAX_TOPIC_LENGTH } from "@lingualink/contracts";
import type { GenerateLength, LanguageCode, LearnerLevel, MappedPair } from "@lingualink/contracts";
import { useServices } from "../../../composition/app-services";
import { LANGUAGE_OPTIONS, LEVEL_OPTIONS } from "../../../shared/languages";
import { PairWorkspace } from "../../../shared/pair-workspace";
import { aiErrorMessage, Busy, Button, Card, ChipRow, Field, Message, screen } from "../../../shared/ui";
import { mapPairsToSpans } from "../../alignment/domain/map-pairs-to-spans";
import { createLesson, LessonDraftError } from "../application/create-lesson";

const LENGTH_OPTIONS: readonly { value: GenerateLength; label: string }[] = [
  { value: "word", label: "Kelime" },
  { value: "phrase", label: "Kelime grubu" },
  { value: "sentence", label: "Cümle" },
  { value: "paragraph", label: "Paragraf" },
];

type Task = "generate" | "translate" | "align" | "save";

const BUSY_TEXT: Record<Task, string> = {
  generate: "Ders üretiliyor…",
  translate: "Çevriliyor…",
  align: "Eşleştiriliyor… Bu genelde 5–15 saniye sürer.",
  save: "Kaydediliyor…",
};

const SAME_LANGUAGE = "Öğrenilen dil ve ana dil farklı olmalı.";

export function CreateLessonScreen({ onSaved }: { onSaved: (lessonId: string) => void }) {
  const services = useServices();
  const [learningLanguage, setLearningLanguage] = useState<LanguageCode>("en");
  const [nativeLanguage, setNativeLanguage] = useState<LanguageCode>("tr");
  const [level, setLevel] = useState<LearnerLevel>("beginner");
  const [title, setTitle] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [pairs, setPairs] = useState<MappedPair[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [topic, setTopic] = useState("");
  const [length, setLength] = useState<GenerateLength>("sentence");
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // İlerleme, hata ve eşleşme sonucu formun altında çıkar; görünür kalmaları sağlanır.
  useEffect(() => {
    if (task || error || pairs.length > 0) scroll.current?.scrollToEnd({ animated: true });
  }, [task, error, pairs.length]);

  const busy = task !== null;
  const languages = { learningLanguage, nativeLanguage, level };
  const hasSource = sourceText.trim() !== "";
  const hasBoth = hasSource && targetText.trim() !== "";
  const sameLanguage = learningLanguage === nativeLanguage;

  const clearPairs = () => {
    if (pairs.length > 0) {
      setPairs([]);
      setNotice("Metin değiştiği için eşleştirme temizlendi.");
    }
  };

  const run = async (name: Task, action: () => Promise<void>) => {
    setTask(name);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (caught) {
      setError(aiErrorMessage(caught));
    } finally {
      setTask(null);
    }
  };

  const generate = () =>
    run("generate", async () => {
      const result = await services.ai.generate({ ...languages, topic, length });
      setSourceText(result.sourceText);
      setTargetText(result.targetText);
      setPairs([]);
    });

  const translate = () =>
    run("translate", async () => {
      const result = await services.ai.translate({ ...languages, sourceText });
      setTargetText(result.targetText);
      setPairs([]);
    });

  const align = () =>
    run("align", async () => {
      const result = await services.ai.align({ ...languages, sourceText, targetText });
      setPairs(mapPairsToSpans({ sourceText, targetText, pairs: result.pairs }));
    });

  const save = () =>
    run("save", async () => {
      try {
        const lesson = await createLesson(
          { repository: services.lessons, newId: services.newId, now: services.now },
          { title, learningLanguage, nativeLanguage, sourceText, targetText, pairs },
        );
        setTitle("");
        setSourceText("");
        setTargetText("");
        setPairs([]);
        setTopic("");
        onSaved(lesson.id);
      } catch (caught) {
        if (caught instanceof LessonDraftError) {
          setError(caught.code === "SAME_LANGUAGE" ? SAME_LANGUAGE : "İki metin de dolu olmalı.");
          return;
        }
        setError("Ders kaydedilemedi. Yeniden deneyin.");
      }
    });

  return (
    <ScrollView ref={scroll} contentContainerStyle={screen.container} keyboardShouldPersistTaps="handled">
      <ChipRow
        label="Öğrenilen dil"
        options={LANGUAGE_OPTIONS}
        value={learningLanguage}
        onChange={(value) => {
          setLearningLanguage(value);
          clearPairs();
        }}
      />
      <ChipRow
        label="Ana dil"
        options={LANGUAGE_OPTIONS}
        value={nativeLanguage}
        onChange={(value) => {
          setNativeLanguage(value);
          clearPairs();
        }}
      />
      <ChipRow label="Seviye" options={LEVEL_OPTIONS} value={level} onChange={setLevel} />
      {sameLanguage ? <Message tone="danger" text={SAME_LANGUAGE} /> : null}

      {showGenerator ? (
        <Card>
          <Field
            label="AI ile üret: konu"
            placeholder="Örn. kahve siparişi"
            value={topic}
            maxLength={MAX_TOPIC_LENGTH}
            editable={!busy}
            onChangeText={setTopic}
          />
          <ChipRow label="Uzunluk" options={LENGTH_OPTIONS} value={length} onChange={setLength} />
          <Button
            label="AI ile üret"
            variant="secondary"
            disabled={busy || sameLanguage || topic.trim() === ""}
            onPress={generate}
          />
        </Card>
      ) : (
        <Button label="Metni AI'a ürettir" variant="secondary" onPress={() => setShowGenerator(true)} />
      )}

      <Field
        label="Öğrenilen dildeki metin"
        placeholder="Kelime, kelime grubu, cümle veya paragraf"
        multiline
        value={sourceText}
        maxLength={MAX_SOURCE_TEXT_LENGTH}
        editable={!busy}
        onChangeText={(text) => {
          setSourceText(text);
          clearPairs();
        }}
      />
      <Field
        label="Ana dildeki karşılığı"
        placeholder="Kendiniz yazın veya AI ile çevirin"
        multiline
        value={targetText}
        maxLength={MAX_TARGET_TEXT_LENGTH}
        editable={!busy}
        onChangeText={(text) => {
          setTargetText(text);
          clearPairs();
        }}
      />

      <View style={screen.row}>
        <Button
          label="AI ile çevir"
          variant="secondary"
          disabled={busy || sameLanguage || !hasSource}
          onPress={translate}
        />
        <Button label="AI ile eşleştir" disabled={busy || sameLanguage || !hasBoth} onPress={align} />
      </View>

      {task ? <Busy text={BUSY_TEXT[task]} /> : null}
      {error ? <Message tone="danger" text={error} /> : null}
      {notice ? <Message text={notice} /> : null}

      {hasBoth ? (
        <Card>
          <PairWorkspace
            sourceText={sourceText}
            targetText={targetText}
            pairs={pairs}
            learningLanguage={learningLanguage}
            onChange={setPairs}
          />
        </Card>
      ) : null}

      <Field label="Ders başlığı (isteğe bağlı)" value={title} maxLength={80} editable={!busy} onChangeText={setTitle} />
      <Button label="Dersi kaydet" disabled={busy || sameLanguage || !hasBoth} onPress={save} />
    </ScrollView>
  );
}
