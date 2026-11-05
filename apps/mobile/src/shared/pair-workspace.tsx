import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { LanguageCode, MappedPair, TextSpan } from "@lingualink/contracts";
import {
  addManualPair,
  ManualPairError,
  removePair,
  segmentText,
  tokenize,
} from "../features/alignment/domain/pair-editor";
import type { TextRange } from "../features/alignment/domain/pair-editor";
import { useServices } from "../composition/app-services";
import { Button, Message, palette, screen } from "./ui";

type Side = "source" | "target";

/** Seçili kelimeler: başlangıç konumu → bitiş konumu. */
type Selection = ReadonlyMap<number, number>;
const NO_SELECTION: Selection = new Map();

/** Seçilen kelimelerin ilkinden sonuncusuna kadar olan ardışık aralık. */
function selectedRange(selection: Selection): TextRange | null {
  if (selection.size === 0) return null;
  return { start: Math.min(...selection.keys()), end: Math.max(...selection.values()) };
}

function AlignedText({
  side,
  text,
  spans,
  selectedOrder,
  selection,
  editable,
  onPressPair,
  onPressToken,
}: {
  side: Side;
  text: string;
  spans: readonly TextSpan[];
  selectedOrder: number | null;
  selection: Selection;
  editable: boolean;
  onPressPair: (order: number) => void;
  onPressToken: (token: TextRange) => void;
}) {
  return (
    <Text accessibilityLabel={side === "source" ? "Öğrenilen dil metni" : "Ana dil metni"} style={styles.text}>
      {segmentText(text, spans).map((segment) => {
        if (segment.kind === "span") {
          const active = selectedOrder === segment.span.pairOrder;
          return (
            <Text
              key={`span-${segment.start}`}
              onPress={() => onPressPair(segment.span.pairOrder)}
              style={{
                backgroundColor: active ? segment.span.color : `${segment.span.color}40`,
                color: active ? "#FFFFFF" : palette.text,
                fontWeight: active ? "700" : "400",
              }}
            >
              {segment.text}
            </Text>
          );
        }
        if (!editable) return <Text key={`plain-${segment.start}`}>{segment.text}</Text>;

        // Düzenleme modunda eşleşmemiş kelimeler tek tek seçilebilir.
        // Kelimeler parça içinde aranır: bitişik noktalama komşu çifte ait olabilir.
        const parts: ReactNode[] = [];
        let cursor = segment.start;
        for (const found of tokenize(segment.text)) {
          const token = { start: segment.start + found.start, end: segment.start + found.end };
          if (token.start > cursor) parts.push(text.slice(cursor, token.start));
          parts.push(
            <Text
              key={`token-${token.start}`}
              onPress={() => onPressToken(token)}
              style={selection.has(token.start) ? styles.selectedToken : styles.token}
            >
              {found.text}
            </Text>,
          );
          cursor = token.end;
        }
        if (cursor < segment.end) parts.push(text.slice(cursor, segment.end));
        return <Text key={`plain-${segment.start}`}>{parts}</Text>;
      })}
    </Text>
  );
}

/**
 * Renkli eşleşme görünümü: bir ifadeye dokununca iki metinde de vurgulanır ve öğrenilen
 * dilde okunur. `onChange` verilirse elle eşleştirme ve çift silme de açılır.
 */
export function PairWorkspace({
  sourceText,
  targetText,
  pairs,
  learningLanguage,
  onChange,
}: {
  sourceText: string;
  targetText: string;
  pairs: readonly MappedPair[];
  learningLanguage: LanguageCode;
  onChange?: (pairs: MappedPair[]) => void;
}) {
  const { speech } = useServices();
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [sourceSelection, setSourceSelection] = useState<Selection>(NO_SELECTION);
  const [targetSelection, setTargetSelection] = useState<Selection>(NO_SELECTION);
  const [error, setError] = useState<string | null>(null);
  const editable = !!onChange;

  // Konumlar metne bağlıdır; metin değişince eski seçimler geçersiz olur.
  useEffect(() => {
    setSourceSelection(NO_SELECTION);
    setTargetSelection(NO_SELECTION);
    setSelectedOrder(null);
    setError(null);
  }, [sourceText, targetText]);

  const pressPair = (order: number) => {
    setSelectedOrder(order);
    setError(null);
    const pair = pairs.find((item) => item.order === order);
    if (pair) speech.speak(pair.source.text, learningLanguage);
  };

  const toggle = (current: Selection, token: TextRange) => {
    const next = new Map(current);
    if (next.has(token.start)) next.delete(token.start);
    else next.set(token.start, token.end);
    return next;
  };

  const clearSelection = () => {
    setSourceSelection(NO_SELECTION);
    setTargetSelection(NO_SELECTION);
  };

  const addPair = () => {
    const source = selectedRange(sourceSelection);
    const target = selectedRange(targetSelection);
    if (!source || !target || !onChange) return;
    try {
      onChange(addManualPair(pairs, { sourceText, targetText, source, target }));
      clearSelection();
      setSelectedOrder(null);
      setError(null);
    } catch (caught) {
      if (!(caught instanceof ManualPairError)) throw caught;
      setError(caught.message);
    }
  };

  const deleteSelected = () => {
    if (selectedOrder === null || !onChange) return;
    onChange(removePair(pairs, selectedOrder));
    setSelectedOrder(null);
  };

  return (
    <View style={styles.workspace}>
      <AlignedText
        side="source"
        text={sourceText}
        spans={pairs.map((pair) => pair.source)}
        selectedOrder={selectedOrder}
        selection={sourceSelection}
        editable={editable}
        onPressPair={pressPair}
        onPressToken={(token) => setSourceSelection((current) => toggle(current, token))}
      />
      <View style={styles.divider} />
      <AlignedText
        side="target"
        text={targetText}
        spans={pairs.map((pair) => pair.target)}
        selectedOrder={selectedOrder}
        selection={targetSelection}
        editable={editable}
        onPressPair={pressPair}
        onPressToken={(token) => setTargetSelection((current) => toggle(current, token))}
      />
      {editable ? (
        <>
          <Message text="Elle eşleştirmek için iki metinden de kelime seçin. Silmek için renkli ifadeye dokunun." />
          <View style={screen.row}>
            <Button
              label="Seçimi eşleştir"
              variant="secondary"
              disabled={sourceSelection.size === 0 || targetSelection.size === 0}
              onPress={addPair}
            />
            <Button label="Çifti sil" variant="secondary" disabled={selectedOrder === null} onPress={deleteSelected} />
          </View>
        </>
      ) : null}
      {error ? <Message tone="danger" text={error} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  workspace: { gap: 10 },
  text: { fontSize: 19, lineHeight: 30, color: palette.text },
  divider: { height: 1, backgroundColor: palette.border },
  token: { textDecorationLine: "underline", textDecorationColor: palette.border },
  selectedToken: { backgroundColor: palette.selection },
});
