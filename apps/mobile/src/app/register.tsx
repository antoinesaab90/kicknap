import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/lib/theme';
import { Button, Field, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Name, email, and a password of at least 6 characters are required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signUp(name.trim(), email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the account.');
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
          <Text style={styles.title}>Create an account</Text>
          <Text style={styles.subtitle}>Book hourly spaces with kicknap.</Text>
          <View style={styles.form}>
            <Field label="Name">
              <Input value={name} onChangeText={setName} placeholder="Alex de Vries" />
            </Field>
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
                placeholder="At least 6 characters"
                secureTextEntry
              />
            </Field>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label={busy ? 'Creating…' : 'Create an account'} onPress={submit} loading={busy} disabled={busy} />
          </View>
          <Pressable onPress={() => router.replace('/login')}>
            <Text style={styles.switch}>Already have an account? Log in</Text>
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