import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Lesson } from "@lingualink/contracts";
import { useServices } from "../../../composition/app-services";
import { Button, Card, Chip, Message, palette, screen } from "../../../shared/ui";
import { buildQuiz, QuizPoolTooSmallError } from "../domain/build-quiz";
import type { QuizQuestion } from "../domain/build-quiz";

const QUESTION_COUNT = 10;

function choiceStyle(index: number, correctIndex: number, picked: number | null) {
  if (picked === null) return null;
  if (index === correctIndex) return styles.correct;
  return index === picked ? styles.wrong : null;
}

export function QuizScreen({ refreshKey }: { refreshKey: number }) {
  const services = useServices();
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    services.lessons
      .list()
      .then((next) => {
        if (active) setLessons(next);
      })
      .catch(() => {
        if (active) setError("Dersler yüklenemedi.");
      });
    return () => {
      active = false;
    };
  }, [services.lessons, refreshKey]);

  const start = () => {
    const chosen = (lessons ?? []).filter((lesson) => selected.size === 0 || selected.has(lesson.id));
    try {
      setQuestions(buildQuiz(chosen, { count: QUESTION_COUNT, random: services.random }));
      setIndex(0);
      setPicked(null);
      setScore(0);
      setError(null);
    } catch (caught) {
      if (!(caught instanceof QuizPoolTooSmallError)) throw caught;
      setError("Quiz için seçili derslerde en az 4 farklı eşleşme olmalı.");
    }
  };

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (questions) {
    const current = questions[index];
    if (!current) {
      return (
        <View style={screen.container}>
          <Text style={screen.title}>
            Sonuç: {score} / {questions.length}
          </Text>
          <Button label="Yeniden başlat" onPress={start} />
          <Button label="Ders seçimine dön" variant="secondary" onPress={() => setQuestions(null)} />
        </View>
      );
    }
    const { question, learningLanguage } = current;
    const pick = (choice: number) => {
      if (picked !== null) return;
      setPicked(choice);
      if (choice === question.correctIndex) setScore((value) => value + 1);
    };
    return (
      <ScrollView contentContainerStyle={screen.container}>
        <Message text={`Soru ${index + 1} / ${questions.length}`} />
        <Card>
          <Text style={screen.title}>{question.prompt}</Text>
          <Button
            label="Dinle"
            variant="secondary"
            onPress={() => services.speech.speak(question.prompt, learningLanguage)}
          />
        </Card>
        {question.choices.map((choice, choiceIndex) => (
          <Pressable
            key={choice}
            accessibilityRole="button"
            disabled={picked !== null}
            onPress={() => pick(choiceIndex)}
            style={[styles.choice, choiceStyle(choiceIndex, question.correctIndex, picked)]}
          >
            <Text style={styles.choiceLabel}>{choice}</Text>
          </Pressable>
        ))}
        {picked !== null ? (
          <>
            <Message
              tone={picked === question.correctIndex ? "success" : "danger"}
              text={picked === question.correctIndex ? "Doğru!" : `Yanlış. Doğrusu: ${question.choices[question.correctIndex]}`}
            />
            <Button
              label={index + 1 === questions.length ? "Sonucu gör" : "Sonraki soru"}
              onPress={() => {
                setIndex((value) => value + 1);
                setPicked(null);
              }}
            />
          </>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={screen.container}>
      <Message text="Quiz'e girecek dersleri seçin. Seçim yapmazsanız tüm dersler kullanılır." />
      {lessons?.length === 0 ? <Message text="Quiz için önce ders oluşturun." /> : null}
      <View style={screen.row}>
        {(lessons ?? []).map((lesson) => (
          <Chip
            key={lesson.id}
            label={lesson.title}
            selected={selected.has(lesson.id)}
            onPress={() => toggle(lesson.id)}
          />
        ))}
      </View>
      {error ? <Message tone="danger" text={error} /> : null}
      <Button label="Quiz başlat" disabled={!lessons || lessons.length === 0} onPress={start} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  choice: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  choiceLabel: { fontSize: 16, color: palette.text },
  correct: { backgroundColor: "#D7F2E3", borderColor: palette.success },
  wrong: { backgroundColor: "#FBDEDE", borderColor: palette.danger },
});
