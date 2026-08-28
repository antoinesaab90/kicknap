import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/lib/theme';
import { Button, Field, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Log in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <Text style={styles.title}>Log in</Text>
          <Text style={styles.subtitle}>Welcome back to kicknap.</Text>
          <View style={styles.form}>
            <Field label="Email">
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Field>
            <Field label="Password">
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
              />
            </Field>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label={busy ? 'Logging in…' : 'Log in'} onPress={submit} loading={busy} disabled={busy} />
          </View>
          <Pressable onPress={() => router.replace('/register')}>
            <Text style={styles.switch}>New here? Create an account</Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: spacing.s4, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: colors.navy900, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: spacing.s2 },
  form: { marginTop: spacing.s6 },
  error: { color: colors.red, fontSize: 13, marginBottom: spacing.s3, fontWeight: '600' },
  switch: {
    textAlign: 'center',
    marginTop: spacing.s5,
    color: colors.navy800,
    fontWeight: '600',
    fontSize: 14,
  },
  back: { textAlign: 'center', marginTop: spacing.s4, color: colors.muted, fontSize: 13 },
});