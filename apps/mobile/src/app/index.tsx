import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listSpaces } from '@/lib/api';
import { formatEuro } from '@/lib/format';
import { colors, radius, spacing } from '@/lib/theme';
import type { Space } from '@/lib/types';
import { useAuth } from '@/lib/auth';

export default function HomeScreen() {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listSpaces({});
        if (active) setSpaces(data.spaces.slice(0, 6));
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <ScreenWithSafeArea>
      <View style={styles.hero}>
        <Text style={styles.logo}>kicknap</Text>
        <Text style={styles.title}>A base between destinations</Text>
        <Text style={styles.subtitle}>
          Hourly stays in quiet Amsterdam spaces — during your workday.
        </Text>
        <Pressable style={styles.searchBtn} onPress={() => router.push('/search')}>
          <Text style={styles.searchBtnText}>Find a space</Text>
        </Pressable>
        {user ? (
          <View style={styles.userBlock}>
            <Text style={styles.userLine}>Signed in as {user.email}</Text>
            <Pressable onPress={() => router.push('/bookings')}>
              <Text style={styles.link}>My bookings</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => router.push('/login')}>
            <Text style={styles.link}>Log in or create an account</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.sectionTitle}>Featured in Amsterdam</Text>
      {loading ? (
        <Text style={styles.mutedText}>Loading…</Text>
      ) : error ? (
        <Text style={styles.mutedText}>Could not load spaces right now.</Text>
      ) : (
        <FlatList
          data={spaces}
          keyExtractor={(s) => String(s.id)}
          renderItem={({ item }) => <SpaceCard space={item} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenWithSafeArea>
  );
}

function ScreenWithSafeArea({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </View>
  );
}

function SpaceCard({ space }: { space: Space }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/spaces/${space.id}`)}
    >
      {space.photoUrl ? (
        <Image source={{ uri: space.photoUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Text style={styles.cardImageLetter}>{space.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {space.name}
          </Text>
          <Text style={styles.cardPrice}>
            {formatEuro(space.hourlyPriceCents)}
            <Text style={styles.cardPriceSuffix}>/hr</Text>
          </Text>
        </View>
        <Text style={styles.cardMeta}>
          {space.neighborhood} · {space.city}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  safeArea: { flex: 1, paddingHorizontal: spacing.s4 },
  hero: { paddingVertical: spacing.s6 },
  logo: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.navy900,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy900,
    marginTop: spacing.s4,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    marginTop: spacing.s2,
    lineHeight: 22,
  },
  searchBtn: {
    backgroundColor: colors.navy800,
    paddingVertical: spacing.s4,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.s5,
  },
  searchBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  link: { color: colors.navy800, fontWeight: '600', marginTop: spacing.s3, fontSize: 14 },
  userLine: { color: colors.muted, marginTop: spacing.s3, fontSize: 13 },
  userBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.navy900,
    marginBottom: spacing.s4,
  },
  mutedText: { color: colors.muted, fontSize: 14 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.navy100,
    marginBottom: spacing.s4,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.92 },
  cardImage: { width: '100%', height: 170, backgroundColor: colors.navy100 },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardImageLetter: { fontSize: 52, fontWeight: '700', color: colors.navy100 },
  cardBody: { padding: spacing.s4 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '700', color: colors.navy900, flexShrink: 1 },
  cardPrice: { fontSize: 16, fontWeight: '700', color: colors.navy900 },
  cardPriceSuffix: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  cardMeta: { fontSize: 13, color: colors.muted, marginTop: spacing.s1 },
});