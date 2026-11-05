import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";
import type { AiGatewayErrorCode } from "../features/alignment/domain/ai-gateway";

export const palette = {
  background: "#F6F7FB",
  surface: "#FFFFFF",
  border: "#D9DDE8",
  text: "#1C2333",
  muted: "#667085",
  primary: "#2563EB",
  primarySoft: "#DBE7FE",
  danger: "#C62828",
  success: "#1B7F4B",
  selection: "#FFE58A",
};

const AI_ERROR_MESSAGES: Record<AiGatewayErrorCode, string> = {
  INVALID_REQUEST: "Bu istek işlenemedi. Metni ve dilleri kontrol edin.",
  MODEL_REFUSED: "AI bu metni işlemeyi reddetti. Elle eşleştirebilirsiniz.",
  ALIGNMENT_FAILED: "AI bu metni güvenilir şekilde eşleştiremedi. Elle eşleştirebilirsiniz.",
  UPSTREAM_ERROR: "AI servisi şu anda yanıt veremiyor. Biraz sonra yeniden deneyin.",
  NETWORK: "AI sunucusuna ulaşılamadı. Sunucunun çalıştığından emin olun.",
  TIMEOUT: "AI yanıtı çok uzun sürdü. Yeniden deneyin.",
};

export const aiErrorMessage = (error: unknown): string => {
  const code = (error as { code?: AiGatewayErrorCode } | null)?.code;
  return (code && AI_ERROR_MESSAGES[code]) ?? "Beklenmeyen bir hata oluştu.";
};

export function Button({
  label,
  onPress,
  disabled,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, styles[variant], disabled && styles.disabled]}
    >
      <Text style={[styles.buttonLabel, variant === "secondary" && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow<Value extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View accessibilityLabel={label} style={styles.row}>
          {options.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={option.value === value}
              onPress={() => onChange(option.value)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function Field({ label, ...input }: { label: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={palette.muted}
        {...input}
        style={[styles.input, input.multiline && styles.multiline]}
      />
    </View>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Message({ text, tone = "muted" }: { text: string; tone?: "muted" | "danger" | "success" }) {
  const color = tone === "danger" ? palette.danger : tone === "success" ? palette.success : palette.muted;
  return (
    <Text accessibilityLiveRegion="polite" style={[styles.message, { color }]}>
      {text}
    </Text>
  );
}

export function Busy({ text }: { text: string }) {
  return (
    <View style={styles.busy}>
      <ActivityIndicator color={palette.primary} />
      <Text style={styles.busyText}>{text}</Text>
    </View>
  );
}

export const screen = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: palette.background, padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: "700", color: palette.text },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});

const styles = StyleSheet.create({
  button: { minHeight: 44, borderRadius: 10, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: palette.primary },
  secondary: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  danger: { backgroundColor: palette.danger },
  disabled: { opacity: 0.45 },
  buttonLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  secondaryLabel: { color: palette.text },
  chip: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  chipSelected: { backgroundColor: palette.primarySoft, borderColor: palette.primary },
  chipLabel: { color: palette.text, fontSize: 14 },
  chipLabelSelected: { color: palette.primary, fontWeight: "600" },
  row: { flexDirection: "row", gap: 8 },
  field: { gap: 6 },
  label: { color: palette.muted, fontSize: 13, fontWeight: "600" },
  input: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: palette.text,
  },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    gap: 10,
  },
  message: { fontSize: 14 },
  busy: { flexDirection: "row", alignItems: "center", gap: 10 },
  busyText: { flex: 1, color: palette.muted, fontSize: 14 },
});
