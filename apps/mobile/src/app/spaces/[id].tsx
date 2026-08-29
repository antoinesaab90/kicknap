import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createBooking,
  createCheckout,
  fetchBlocked,
  fetchSpace,
  fetchWeeklyHours,
  paymentStatus,
  type OpeningHourRule,
} from '@/lib/api';
import {
  availableStartMinutes,
  dayState,
  freeIntervals,
  minutesToHm,
  windowsFromStart,
  type BookedWindow,
} from '@/lib/booking';
import { amsOffsetMinutes, amsZonedIso, formatAmsterdam, formatEuro } from '@/lib/format';
import { colors, radius, spacing } from '@/lib/theme';
import type { Space } from '@/lib/types';
import { Button, Pill } from '@/components/ui';
import { CalendarGrid, CalendarLegend, CalendarPanel } from '@/components/availability-calendar';
import { useAuth } from '@/lib/auth';

export default function SpaceDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const { user, token } = useAuth();

  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<OpeningHourRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [booked, setBooked] = useState<BookedWindow[]>([]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState('');
  const [startMin, setStartMin] = useState<number | null>(null);
  const [endMin, setEndMin] = useState<number | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const todayAms = useMemo(() => {
    const now = new Date();
    const shifted = now.getTime() + amsOffsetMinutes(now.toISOString().slice(0, 10)) * 60000;
    const d = new Date(shifted);
    const y = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
    const da = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const s = await fetchSpace(id);
      const r = await fetchWeeklyHours(id).catch(() => []);
      if (active) {
        setSpace(s);
        setRules(r);
        setRulesLoading(false);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const monthFirst = `${month.y}-${String(month.m + 1).padStart(2, '0')}-01`;
  const nextMonthFirst = useMemo(() => {
    const d = new Date(Date.UTC(month.y, month.m + 1, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
  }, [month]);

  useEffect(() => {
    if (!space) return;
    let active = true;
    (async () => {
      const fromIso = amsZonedIso(monthFirst, '00:00');
      const toIso = amsZonedIso(nextMonthFirst, '00:00');
      const blocked = await fetchBlocked(space.id, fromIso, toIso).catch(() => []);
      if (active) setBooked(blocked);
    })();
    return () => {
      active = false;
    };
  }, [space, monthFirst, nextMonthFirst]);

  const minHours = space?.minHours ?? 0;
  const maxHours = space?.maxHours ?? 0;
  const isFixed = space != null && minHours === maxHours;

  const dayInfo = useCallback(
    (dateStr: string) => {
      const state = dayState(dateStr, rules, booked, minHours);
      return { state, past: dateStr < todayAms };
    },
    [rules, booked, minHours, todayAms]
  );

  const selectedFree = useMemo(
    () => (selectedDate ? freeIntervals(selectedDate, rules, booked) : []),
    [selectedDate, rules, booked]
  );

  const fixedWindows = useMemo(() => {
    if (!isFixed) return [];
    return selectedFree
      .filter((iv) => iv.end - iv.start >= minHours * 60)
      .map((iv) => ({ start: iv.start, end: iv.start + minHours * 60 }));
  }, [isFixed, selectedFree, minHours]);

  useEffect(() => {
    if (isFixed && fixedWindows.length === 1) {
      setStartMin(fixedWindows[0].start);
      setEndMin(fixedWindows[0].end);
    }
  }, [isFixed, fixedWindows]);

  const startOptions = useMemo(
    () => (selectedDate && minHours > 0 ? availableStartMinutes(selectedFree, minHours) : []),
    [selectedDate, selectedFree, minHours]
  );

  const endOptions = useMemo(
    () =>
      startMin != null && maxHours > 0
        ? windowsFromStart(selectedFree, startMin, minHours, maxHours)
        : [],
    [selectedFree, startMin, minHours, maxHours]
  );

  const pickDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setStartMin(null);
    setEndMin(null);
    if (!isFixed) setStartMin(availableStartMinutes(freeIntervals(dateStr, rules, booked), minHours)[0] ?? null);
  };

  const pickStart = (minutes: number) => {
    setStartMin(minutes);
    const ends = windowsFromStart(selectedFree, minutes, minHours, maxHours);
    setEndMin(ends[0] ?? null);
  };

  const totalCents = useMemo(() => {
    if (!space || startMin == null || endMin == null) return 0;
    return Math.round(((endMin - startMin) / 60) * space.hourlyPriceCents);
  }, [space, startMin, endMin]);

  const bookNow = async () => {
    if (!space) return;
    if (!user || !token) {
      Alert.alert('Log in to book', 'You need an account to book a space.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log in', onPress: () => router.push('/login') },
      ]);
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate) || startMin == null || endMin == null || endMin <= startMin) {
      Alert.alert('Pick a time', 'Choose an available day and a time slot.');
      return;
    }
    const durationHours = (endMin - startMin) / 60;
    if (durationHours < minHours || durationHours > maxHours) {
      Alert.alert('Not allowed', `This space books between ${minHours} and ${maxHours} hours.`);
      return;
    }
    const fromIso = amsZonedIso(selectedDate, minutesToHm(startMin));
    const toIso = amsZonedIso(selectedDate, minutesToHm(endMin));
    if (selectedDate === todayAms && Date.parse(fromIso) <= Date.now() - 60000) {
      Alert.alert('Too late', 'Pick a start time in the future.');
      return;
    }
    setBusy(true);
    try {
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
      const friendly = raw.includes('slot_conflict')
        ? 'That slot is already taken. Try another time.'
        : raw.includes('already_paid')
          ? 'This booking was already paid.'
          : raw.includes('shorter_than_min') || raw.includes('longer_than_max')
            ? `This space books between ${minHours} and ${maxHours} hours.`
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
          <Button label="Back to search" onPress={() => router.replace('/search')} />
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
                {minHours}h min · {maxHours}h max
              </Text>
            </View>

            <View style={styles.bookingBox}>
              <Text style={styles.bookingTitle}>Book this space</Text>

              <Text style={styles.fieldLabel}>Date</Text>
              <Pressable style={styles.dateField} onPress={() => setCalendarOpen((v) => !v)}>
                <Text style={selectedDate ? styles.dateFieldValue : styles.dateFieldPlaceholder}>
                  {selectedDate ? formatAmsterdam(amsZonedIso(selectedDate, '00:00')) : 'Pick a date'}
                </Text>
                <Text style={styles.dateFieldCaret}>{calendarOpen ? '▲' : '▼'}</Text>
              </Pressable>

              {calendarOpen && (
                <CalendarPanel
                  year={month.y}
                  month={month.m}
                  onPrev={() => setMonth((m) => (m.m === 0 ? { y: m.y - 1, m: 11 } : { y: m.y, m: m.m - 1 }))}
                  onNext={() => setMonth((m) => (m.m === 11 ? { y: m.y + 1, m: 0 } : { y: m.y, m: m.m + 1 }))}
                >
                  {rulesLoading ? (
                    <View style={styles.centerPad}>
                      <ActivityIndicator color={colors.navy800} />
                    </View>
                  ) : (
                    <View>
                      <CalendarGrid
                        year={month.y}
                        month={month.m}
                        selectedDate={selectedDate}
                        todayDate={todayAms}
                        dayInfo={dayInfo}
                        onSelect={pickDate}
                      />
                      <CalendarLegend />
                    </View>
                  )}
                </CalendarPanel>
              )}

              {selectedDate ? (
                <View>
                  <Text style={styles.fieldLabel}>
                    {isFixed ? 'Available session' : 'Start time'}
                  </Text>

                  {isFixed ? (
                    fixedWindows.length === 0 ? (
                      <Text style={styles.mutedSm}>No free session left on this day.</Text>
                    ) : (
                      <View style={styles.chipsRow}>
                        {fixedWindows.map((w) => (
                          <Pill
                            key={w.start}
                            label={`${minutesToHm(w.start)}–${minutesToHm(w.end)}`}
                            active={startMin === w.start && endMin === w.end}
                            onPress={() => {
                              setStartMin(w.start);
                              setEndMin(w.end);
                            }}
                          />
                        ))}
                      </View>
                    )
                  ) : (
                    <View>
                      {startOptions.length === 0 ? (
                        <Text style={styles.mutedSm}>No free time left on this day.</Text>
                      ) : (
                        <View style={styles.chipsRow}>
                          {startOptions.map((m) => (
                            <Pill key={m} label={minutesToHm(m)} active={startMin === m} onPress={() => pickStart(m)} />
                          ))}
                        </View>
                      )}
                      {startMin != null && endOptions.length > 1 && (
                        <>
                          <Text style={styles.fieldLabel}>End time</Text>
                          <View style={styles.chipsRow}>
                            {endOptions.map((m) => (
                              <Pill key={m} label={minutesToHm(m)} active={endMin === m} onPress={() => setEndMin(m)} />
                            ))}
                          </View>
                        </>
                      )}
                    </View>
                  )}

                  {startMin != null && endMin != null && (
                    <Text style={styles.slotSummary}>
                      {formatAmsterdam(amsZonedIso(selectedDate, minutesToHm(startMin)))} →{' '}
                      {minutesToHm(endMin)}
                    </Text>
                  )}
                </View>
              ) : null}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {startMin == null || endMin == null ? '—' : formatEuro(totalCents)}
                </Text>
              </View>
              <Button
                label={busy ? 'Booking…' : 'Book now'}
                onPress={bookNow}
                loading={busy}
                disabled={busy}
              />
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: spacing.s3,
  },
  dateField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.navy50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.navy100,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2 + 2,
  },
  dateFieldValue: { fontSize: 14, color: colors.text, fontWeight: '600' },
  dateFieldPlaceholder: { fontSize: 14, color: colors.muted },
  dateFieldCaret: { fontSize: 11, color: colors.muted },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.s1 },
  mutedSm: { fontSize: 13, color: colors.muted, marginTop: spacing.s2 },
  slotSummary: {
    fontSize: 13,
    color: colors.navy700,
    fontWeight: '600',
    marginTop: spacing.s3,
  },
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
  centerPad: { alignItems: 'center', paddingVertical: spacing.s5 },
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