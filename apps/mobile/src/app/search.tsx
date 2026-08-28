import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { checkMany, listSpaces } from '@/lib/api';
import { amsZonedIso, formatEuro } from '@/lib/format';
import { colors, radius, spacing } from '@/lib/theme';
import type { Space } from '@/lib/types';
import { Pill } from '@/components/ui';

const AREAS = [
  { value: '', label: 'All' },
  { value: 'centrum', label: 'Centrum' },
  { value: 'oost', label: 'Oost' },
  { value: 'west', label: 'West' },
  { value: 'zuid', label: 'Zuid' },
  { value: 'noord', label: 'Noord' },
  { value: 'schiphol', label: 'Schiphol' },
];
const HOUR_OPTIONS = [1, 2, 3, 4, 6, 8];

export default function SearchScreen() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [area, setArea] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [hours, setHours] = useState(2);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listSpaces({ area: area || undefined });
        if (active) setSpaces(data.spaces);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [area]);

  const filtered = useMemo(() => spaces, [spaces]);

  const runCheck = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      Alert.alert('Pick a time', 'Choose a date and a start time to check availability.');
      return;
    }
    setChecking(true);
    try {
      const fromIso = amsZonedIso(date, time);
      const toIso = new Date(Date.parse(fromIso) + hours * 3600_000).toISOString();
      const data = await checkMany(fromIso, toIso);
      const availableIds = new Set(data.results.filter((r) => r.available).map((r) => r.spaceId));
      const visible = spaces.filter((s) => availableIds.has(s.id));
      if (visible.length === 0) {
        Alert.alert('Nothing free', 'No spaces are free at that time — try a different slot.');
      } else {
        Alert.alert('Free spaces', `${visible.length} of ${spaces.length} spaces are free at that time. Tapping one books it.`);
      }
      setSpaces(visible);
    } catch {
      Alert.alert('Oops', 'Could not check availability right now.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Find a space</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {AREAS.map((a) => (
            <Pill
              key={a.value}
              label={a.label}
              active={area === a.value}
              onPress={() => setArea(a.value)}
            />
          ))}
        </ScrollView>

        <View style={styles.filterCard}>
          <View style={styles.filterRow}>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Date</Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="2026-09-01"
                placeholderTextColor={colors.muted}
                style={styles.filterInput}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>From</Text>
              <TextInput
                value={time}
                onChangeText={setTime}
                placeholder="10:00"
                placeholderTextColor={colors.muted}
                style={styles.filterInput}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Hours</Text>
              <View style={styles.hoursRow}>
                {HOUR_OPTIONS.map((h) => (
                  <Pressable
                    key={h}
                    onPress={() => setHours(h)}
                    style={[styles.hourChip, hours === h && styles.hourChipActive]}
                  >
                    <Text style={[styles.hourChipText, hours === h && styles.hourChipTextActive]}>
                      {h}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
          <Pressable
            style={[styles.checkBtn, checking && styles.checkBtnDisabled]}
            onPress={runCheck}
            disabled={checking}
          >
            <Text style={styles.checkBtnText}>{checking ? 'Checking…' : 'Check availability'}</Text>
          </Pressable>
        </View>

        {loading ? (
          <Text style={styles.muted}>Loading spaces…</Text>
        ) : error ? (
          <Text style={styles.muted}>Could not load spaces right now.</Text>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(s) => String(s.id)}
            renderItem={({ item }) => <SearchCard space={item} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function SearchCard({ space }: { space: Space }) {
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
        <Text style={styles.cardMeta}>
          {space.minHours}h min · {space.maxHours}h max
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  safeArea: { flex: 1, paddingHorizontal: spacing.s4 },
  title: { fontSize: 26, fontWeight: '800', color: colors.navy900, marginTop: spacing.s4 },
  pillsRow: { flexDirection: 'row', gap: spacing.s2, paddingVertical: spacing.s4 },
  filterCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.navy100,
    padding: spacing.s4,
    marginBottom: spacing.s4,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s3 },
  filterField: { flex: 1, minWidth: 90 },
  filterLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  filterInput: {
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
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hourChipActive: { backgroundColor: colors.navy800, borderColor: colors.navy800 },
  hourChipText: { fontSize: 12, fontWeight: '600', color: colors.navy700 },
  hourChipTextActive: { color: colors.white },
  checkBtn: {
    backgroundColor: colors.navy800,
    borderRadius: radius.lg,
    paddingVertical: spacing.s3 + 2,
    alignItems: 'center',
    marginTop: spacing.s4,
  },
  checkBtnDisabled: { opacity: 0.6 },
  checkBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 14, paddingVertical: spacing.s4 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.navy100,
    marginBottom: spacing.s4,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.92 },
  cardImage: { width: '100%', height: 150, backgroundColor: colors.navy100 },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardImageLetter: { fontSize: 48, fontWeight: '700', color: colors.navy100 },
  cardBody: { padding: spacing.s4 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '700', color: colors.navy900, flexShrink: 1 },
  cardPrice: { fontSize: 16, fontWeight: '700', color: colors.navy900 },
  cardPriceSuffix: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  cardMeta: { fontSize: 13, color: colors.muted, marginTop: spacing.s1 },
});