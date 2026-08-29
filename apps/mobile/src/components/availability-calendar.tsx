import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DayState } from '@/lib/booking';
import { colors, radius, spacing } from '@/lib/theme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export interface CalendarDayInfo {
  state: DayState;
  past: boolean;
}

export function CalendarGrid({
  year,
  month,
  selectedDate,
  todayDate,
  dayInfo,
  onSelect,
}: {
  year: number;
  month: number;
  selectedDate?: string;
  todayDate: string;
  dayInfo: (dateStr: string) => CalendarDayInfo;
  onSelect: (dateStr: string) => void;
}) {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View>
      <View style={styles.grid}>
        {WEEKDAYS.map((w, i) => (
          <Text key={`h-${i}`} style={styles.weekdayHeader}>
            {w}
          </Text>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <View key={`b-${i}`} style={styles.cell} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const info = dayInfo(dateStr);
          const selectable = info.state === 'open' && !info.past;
          const selected = dateStr === selectedDate;
          const today = dateStr === todayDate;
          return (
            <Pressable
              key={dateStr}
              disabled={!selectable}
              onPress={() => onSelect(dateStr)}
              style={[styles.cell, selected && styles.cellSelected, today && styles.cellToday]}
            >
              <Text
                style={[
                  styles.dayText,
                  !selectable && styles.dayTextMuted,
                  info.state === 'booked' && styles.dayTextBooked,
                  selected && styles.dayTextSelected,
                ]}
              >
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function CalendarPanel({
  year,
  month,
  onPrev,
  onNext,
  children,
}: {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Pressable onPress={onPrev} style={styles.navBtn} hitSlop={8}>
          <Text style={styles.navBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {MONTHS[month]} {year}
        </Text>
        <Pressable onPress={onNext} style={styles.navBtn} hitSlop={8}>
          <Text style={styles.navBtnText}>›</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

export function CalendarLegend() {
  return (
    <View style={styles.legend}>
      <LegendItem color={colors.navy900} strikethrough={false} muted={false} label="Free" />
      <LegendItem color={colors.muted} strikethrough muted label="Booked" />
      <LegendItem color={colors.muted} strikethrough={false} muted label="Closed" />
    </View>
  );
}

function LegendItem({
  color,
  strikethrough,
  muted,
  label,
}: {
  color: string;
  strikethrough: boolean;
  muted: boolean;
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      <Text
        style={[styles.legendSwatch, { color }, strikethrough && styles.dayTextBooked, muted && styles.dayTextMuted]}
      >
        21
      </Text>
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.s3,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.navy100,
    padding: spacing.s3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s2,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy50,
  },
  navBtnText: { fontSize: 20, color: colors.navy800, fontWeight: '700' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.navy900 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekdayHeader: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    paddingVertical: spacing.s1,
    textTransform: 'uppercase',
  },
  cell: {
    width: `${100 / 7}%`,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellToday: { borderRadius: 6, backgroundColor: colors.gold100 },
  cellSelected: { borderRadius: 6, backgroundColor: colors.navy800 },
  dayText: { fontSize: 14, fontWeight: '600', color: colors.navy900 },
  dayTextMuted: { color: '#bec6cf' },
  dayTextBooked: { color: '#9aa3ad', textDecorationLine: 'line-through' },
  dayTextSelected: { color: colors.white },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.s2,
    paddingTop: spacing.s2,
    borderTopWidth: 1,
    borderTopColor: colors.navy100,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendSwatch: { fontSize: 14, fontWeight: '700' },
  legendLabel: { fontSize: 12, color: colors.muted },
});