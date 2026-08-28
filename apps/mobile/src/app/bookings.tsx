import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { myBookings } from '@/lib/api';
import { formatAmsterdam, formatEuro } from '@/lib/format';
import { colors, radius, spacing } from '@/lib/theme';
import type { Booking } from '@/lib/types';
import { Button, StatusChip } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function BookingsScreen() {
  const { user, token, signOut } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user || !token) return;
    let active = true;
    (async () => {
      try {
        const data = await myBookings(token, user.email);
        if (active) setBookings(data);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, token]);

  const doSignOut = useCallback(async () => {
    await signOut();
    router.replace('/');
  }, [signOut]);

  if (!user) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={[styles.safeArea, styles.centered]}>
          <Text style={styles.muted}>Log in to see your bookings.</Text>
          <View style={styles.cta}>
            <Button label="Log in" onPress={() => router.push('/login')} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>My bookings</Text>
          <Pressable onPress={doSignOut}>
            <Text style={styles.signOut}>Sign out</Text>
          </Pressable>
        </View>
        {loading ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : error ? (
          <Text style={styles.muted}>Could not load your bookings.</Text>
        ) : bookings.length === 0 ? (
          <Text style={styles.muted}>No bookings yet. Find a space to get started.</Text>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(b) => String(b.id)}
            renderItem={({ item }) => <BookingCard booking={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const tone =
    booking.status === 'paid' ? 'ok' : booking.status === 'cancelled' ? 'bad' : 'wait';
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardId}>Booking #{booking.id}</Text>
        <StatusChip label={booking.status} tone={tone} />
      </View>
      <Text style={styles.cardTime}>
        {formatAmsterdam(booking.fromTs)} → {formatAmsterdam(booking.toTs)}
      </Text>
      <Text style={styles.cardMeta}>
        Space {booking.spaceId} · {booking.durationMinutes} min
      </Text>
      <Text style={styles.cardPrice}>{formatEuro(booking.priceCents)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  safeArea: { flex: 1, paddingHorizontal: spacing.s4 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.s4,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.navy900, marginTop: spacing.s4 },
  signOut: { color: colors.red, fontWeight: '600', fontSize: 14 },
  list: { paddingBottom: spacing.s6 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.navy100,
    padding: spacing.s4,
    marginBottom: spacing.s3 + 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s2,
  },
  cardId: { fontSize: 14, fontWeight: '700', color: colors.navy900 },
  cardTime: { fontSize: 15, color: colors.navy900, fontWeight: '600', marginTop: spacing.s1 },
  cardMeta: { fontSize: 13, color: colors.muted, marginTop: spacing.s1 },
  cardPrice: { fontSize: 18, fontWeight: '800', color: colors.navy900, marginTop: spacing.s2 },
  cta: { marginTop: spacing.s5, alignSelf: 'stretch', paddingHorizontal: spacing.s4 },
  muted: { color: colors.muted, fontSize: 15, textAlign: 'center' },
});