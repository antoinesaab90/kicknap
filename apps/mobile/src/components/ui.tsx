import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from '@/lib/theme';

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'gold';
  disabled?: boolean;
  loading?: boolean;
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        isPrimary ? styles.btnPrimary : styles.btnGold,
        (disabled || loading) && styles.btnDisabled,
        pressed && styles.btnPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.navy900} />
      ) : (
        <Text style={isPrimary ? styles.btnPrimaryText : styles.btnGoldText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active && styles.pillActive,
        pressed && styles.pillPressed,
      ]}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function StatusChip({ label, tone }: { label: string; tone: 'ok' | 'wait' | 'bad' }) {
  const bg =
    tone === 'ok' ? styles.chipOkBg : tone === 'bad' ? styles.chipBadBg : styles.chipWaitBg;
  const fg = tone === 'ok' ? styles.chipOkText : tone === 'bad' ? styles.chipBadText : styles.chipWaitText;
  return (
    <View style={[styles.chip, bg]}>
      <Text style={[styles.chipText, fg]}>{label}</Text>
    </View>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  return (
    <View style={styles.inputWrap}>
      <TextInputInner
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function TextInputInner(props: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  return <TextInput {...props} style={styles.input} placeholderTextColor={colors.muted} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.navy100,
    padding: spacing.s4,
  },
  btnPrimary: {
    backgroundColor: colors.navy800,
    borderRadius: radius.lg,
    paddingVertical: spacing.s4,
    alignItems: 'center',
  },
  btnGold: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingVertical: spacing.s4,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnPrimaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  btnGoldText: {
    color: colors.navy900,
    fontSize: 15,
    fontWeight: '700',
  },
  pill: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.navy100,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2 + 2,
  },
  pillActive: {
    backgroundColor: colors.navy800,
    borderColor: colors.navy800,
  },
  pillPressed: {
    opacity: 0.8,
  },
  pillText: {
    color: colors.navy700,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: colors.white,
  },
  chip: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s1 + 2,
  },
  chipOkBg: { backgroundColor: colors.emeraldBg },
  chipWaitBg: { backgroundColor: colors.navy100 },
  chipBadBg: { backgroundColor: colors.redBg },
  chipText: { fontSize: 12, fontWeight: '700' },
  chipOkText: { color: '#0a8f52' },
  chipWaitText: { color: colors.muted },
  chipBadText: { color: colors.red },
  field: {
    marginBottom: spacing.s4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing.s2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrap: {
    backgroundColor: colors.navy50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.navy100,
  },
  input: {
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
    fontSize: 15,
    color: colors.text,
  },
});