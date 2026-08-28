import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBooking, createCheckout, fetchSpace, paymentStatus } from '@/lib/api';
import { amsOffsetMinutes, amsZonedIso, formatEuro } from '@/lib/format';
import { colors, radius, spacing } from '@/lib/theme';
import type { Space } from '@/lib/types';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';

const BASE_HOURS = [1, 2, 3, 4, 6, 8];

export default function SpaceDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const { user, token } = useAuth();

  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [hours, setHours] = useState(2);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const s = await fetchSpace(id);
      if (active) {
        setSpace(s);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const totalCents = useMemo(
    () => (space ? space.hourlyPriceCents * hours : 0),
    [space, hours]
  );

  const hourOptions = useMemo(() => {
    if (!space) return [2];
    const set = new Set<number>();
    for (const h of BASE_HOURS) {
      if (h >= space.minHours && h <= space.maxHours) set.add(h);
    }
    set.add(space.minHours);
    set.add(space.maxHours);
    return Array.from(set).sort((a, b) => a - b);
  }, [space]);

  useEffect(() => {
    if (space && !hourOptions.includes(hours)) {
      setHours(space.minHours);
    }
  }, [space, hourOptions, hours]);

  const todayAms = useMemo(() => {
    const now = new Date();
    const shifted = now.getTime() + amsOffsetMinutes(now.toISOString().slice(0, 10)) * 60000;
    const d = new Date(shifted);
    const y = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
    const da = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  }, []);

  const bookNow = async () => {
    if (!space) return;
    if (!user || !token) {
      Alert.alert('Log in to book', 'You need an account to book a space.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log in', onPress: () => router.push('/login') },
      ]);
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      Alert.alert('Pick a time', 'Choose a date and start time.');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(time) || Number(time.slice(0, 2)) > 23 || Number(time.slice(3)) > 59) {
      Alert.alert('Invalid time', 'Use a time between 00:00 and 23:59.');
      return;
    }
    if (date < todayAms) {
      Alert.alert('Date in the past', 'Pick today or a later date.');
      return;
    }
    if (hours < space.minHours || hours > space.maxHours) {
      Alert.alert('Not allowed', `This space books between ${space.minHours} and ${space.maxHours} hours.`);
      return;
    }
    setBusy(true);
    try {
      const fromIso = amsZonedIso(date, time);
      if (date === todayAms && Date.parse(fromIso) <= Date.now() - 60000) {
        setBusy(false);
        Alert.alert('Too late', 'Pick a start time in the future.');
        return;
      }
      const toIso = new Date(Date.parse(fromIso) + hours * 3600_000).toISOString();
      const { booking } = await createBooking({
        token,
        spaceId: space.id,
        from: fromIso,
        to: toIso,
        guestEmail: user.email,
        guestName: user.name,
      });
      const successUrl = `kicknap://booking-result?booking=${booking.id}`;
      const cancelUrl = `kicknap://search`;
      const session = await createCheckout({
        bookingId: booking.id,
        successUrl,
        cancelUrl,
      });
      void WebBrowser.openBrowserAsync(session.url).catch(() => {});
      await waitForPayment(booking.id);
      router.replace('/bookings');
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Booking failed.';
      const friendly =
        raw.includes('slot_conflict')
          ? 'That slot is already taken. Try another time.'
          : raw.includes('already_paid')
            ? 'This booking was already paid.'
            : raw;
      Alert.alert('Booking failed', friendly);
    } finally {
      setBusy(false);
    }
  };

  const waitForPayment = async (bookingId: number) => {
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2500));
      const status = await paymentStatus(bookingId).catch(() => ({ status: null }));
      if (status.status === 'succeeded') {
        Alert.alert("Paid — you're booked!", 'See your bookings for details.');
        return;
      }
      if (status.status === 'failed') {
        Alert.alert('Payment failed', 'You can retry from your bookings.');
        return;
      }
    }
    Alert.alert('Payment pending', "Check your bookings — we'll confirm once payment clears.");
  };

  if (loading) {
    return (
      <SimpleScreen>
        <Text style={styles.muted}>Loading…</Text>
      </SimpleScreen>
    );
  }

  if (!space) {
    return (
      <SimpleScreen>
        <Text style={styles.muted}>This space is not available.</Text>
        <View style={styles.cta}>
          <Button
            label="Back to search"
            onPress={() => router.replace('/search')}
          />
        </View>
      </SimpleScreen>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {space.photoUrl ? (
            <Image source={{ uri: space.photoUrl }} style={styles.hero} />
          ) : (
            <View style={[styles.hero, styles.heroPlaceholder]}>
              <Text style={styles.heroLetter}>{space.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}

          <View style={styles.body}>
            <Text style={styles.name}>{space.name}</Text>
            <Text style={styles.meta}>
              {space.neighborhood} · {space.city}
            </Text>
            {space.description ? <Text style={styles.description}>{space.description}</Text> : null}

            <View style={styles.priceRow}>
              <Text style={styles.price}>
                {formatEuro(space.hourlyPriceCents)}
                <Text style={styles.priceSuffix}>/hr</Text>
              </Text>
              <Text style={styles.meta}>
                {space.minHours}h min · {space.maxHours}h max
              </Text>
            </View>

            <View style={styles.bookingBox}>
              <Text style={styles.bookingTitle}>Book this space</Text>
              <View style={styles.row}>
                <InputLabel label="Date" value={date} onChangeText={setDate} placeholder="2026-09-01" />
                <InputLabel label="From" value={time} onChangeText={setTime} placeholder="10:00" />
              </View>
              <Text style={styles.fieldLabel}>Hours</Text>
              <View style={styles.hoursRow}>
                {hourOptions.map((h) => (
                  <Pressable
                    key={h}
                    onPress={() => setHours(h)}
                    style={[styles.hourChip, hours === h && styles.hourChipActive]}
                  >
                    <Text style={[styles.hourChipText, hours === h && styles.hourChipTextActive]}>
                      {h}h
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatEuro(totalCents)}</Text>
              </View>
              <Button label={busy ? 'Booking…' : 'Book now'} onPress={bookNow} loading={busy} disabled={busy} />
              {!user && (
                <Pressable onPress={() => router.push('/login')}>
                  <Text style={styles.loginHint}>Log in to book this space</Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

function SimpleScreen({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.screen}>
      <SafeAreaView style={[styles.safeArea, styles.simpleContent]}>{children}</SafeAreaView>
    </View>
  );
}

function InputLabel({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.inputField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  safeArea: { flex: 1 },
  simpleContent: { paddingHorizontal: spacing.s4, justifyContent: 'center' },
  hero: { width: '100%', height: 230, backgroundColor: colors.navy100 },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroLetter: { fontSize: 72, fontWeight: '700', color: colors.navy100 },
  body: { padding: spacing.s4 },
  name: { fontSize: 24, fontWeight: '800', color: colors.navy900, letterSpacing: -0.3 },
  meta: { fontSize: 13, color: colors.muted, marginTop: spacing.s1 },
  description: { fontSize: 15, color: colors.navy700, marginTop: spacing.s4, lineHeight: 22 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.s5,
  },
  price: { fontSize: 22, fontWeight: '800', color: colors.navy900 },
  priceSuffix: { fontSize: 13, color: colors.muted, fontWeight: '500' },
  bookingBox: {
    marginTop: spacing.s5,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.navy100,
    padding: spacing.s4,
  },
  bookingTitle: { fontSize: 16, fontWeight: '700', color: colors.navy900, marginBottom: spacing.s3 },
  row: { flexDirection: 'row', gap: spacing.s3 },
  inputField: { flex: 1 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: spacing.s3,
  },
  input: {
    backgroundColor: colors.navy50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.navy100,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2 + 2,
    fontSize: 14,
    color: colors.text,
  },
  hoursRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hourChip: {
    borderWidth: 1,
    borderColor: colors.navy100,
    backgroundColor: colors.navy50,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  hourChipActive: { backgroundColor: colors.navy800, borderColor: colors.navy800 },
  hourChipText: { fontSize: 12, fontWeight: '600', color: colors.navy700 },
  hourChipTextActive: { color: colors.white },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.s4,
  },
  totalLabel: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.navy900 },
  loginHint: {
    textAlign: 'center',
    marginTop: spacing.s3,
    color: colors.navy800,
    fontWeight: '600',
    fontSize: 13,
  },
  backBtn: {
    position: 'absolute',
    top: 54,
    left: spacing.s4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.s3,
    paddingVertical: 6,
  },
  backBtnText: { color: colors.navy900, fontWeight: '700', fontSize: 14 },
  cta: { marginTop: spacing.s6 },
  muted: { color: colors.muted, fontSize: 15, textAlign: 'center' },
});