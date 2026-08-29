"use client";

import type { DayState } from "@/lib/availability";

export interface CalendarDayInfo {
  state: DayState;
  past: boolean;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function weekdayNames(lang: string): string[] {
  const fmt = new Intl.DateTimeFormat(lang === "nl" ? "nl-NL" : "en-GB", {
    weekday: "narrow",
    timeZone: "UTC",
  });
  return WEEKDAYS.map((_, i) =>
    fmt.format(new Date(Date.UTC(2026, 0, i + 5)))
  );
}

function monthLabel(year: number, month: number, lang: string): string {
  const title = new Intl.DateTimeFormat(lang === "nl" ? "nl-NL" : "en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month, 1)));
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function BookingCalendar({
  year,
  month,
  selectedDate,
  todayDate,
  lang,
  loading,
  prevLabel,
  nextLabel,
  legendAvailable,
  legendBooked,
  legendClosed,
  dayInfo,
  onSelect,
  onPrev,
  onNext,
}: {
  year: number;
  month: number;
  selectedDate: string;
  todayDate: string;
  lang: string;
  loading: boolean;
  prevLabel: string;
  nextLabel: string;
  legendAvailable: string;
  legendBooked: string;
  legendClosed: string;
  dayInfo: (dateStr: string) => CalendarDayInfo;
  onSelect: (dateStr: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const leadingBlanks = (firstWeekday + 6) % 7;

  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const wd = weekdayNames(lang);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          title={prevLabel}
          aria-label={prevLabel}
          onClick={onPrev}
          className="flex h-8 w-8 items-center justify-center rounded-full text-navy-600 transition-colors hover:bg-navy-100"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="text-sm font-semibold text-navy-900">{monthLabel(year, month, lang)}</p>
        <button
          type="button"
          title={nextLabel}
          aria-label={nextLabel}
          onClick={onNext}
          className="flex h-8 w-8 items-center justify-center rounded-full text-navy-600 transition-colors hover:bg-navy-100"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M8 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {loading ? (
        <p className="mt-2 text-center text-sm text-navy-600">…</p>
      ) : (
        <>
          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-navy-500">
            {wd.map((name, i) => (
              <span key={i} className="py-1">
                {name}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <span key={`b${i}`} />;
              const ds = dateStr(year, month, day);
              const info = dayInfo(ds);
              const isSelected = ds === selectedDate;
              const isToday = ds === todayDate;
              const interactive = info.state === "open" && !info.past;
              const cls = [
                "flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors",
                interactive
                  ? "cursor-pointer text-navy-900 hover:bg-gold-100"
                  : "cursor-not-allowed",
                info.state === "booked" ? "text-navy-300 line-through" : "",
                info.state === "closed" ? "text-navy-200" : "",
                info.state === "open" && info.past ? "text-navy-200" : "",
                isSelected ? "bg-gold-600 font-bold text-navy-950" : "",
                isToday && !isSelected ? "ring-1 ring-navy-400" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <span key={i} className="flex justify-center">
                  <button
                    type="button"
                    disabled={!interactive}
                    onClick={() => onSelect(ds)}
                    className={cls}
                  >
                    {day}
                  </button>
                </span>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-4 border-t border-navy-100 pt-3 text-xs text-navy-600">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-navy-900" />
              {legendAvailable}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="relative h-3 w-3 rounded-full border border-navy-300">
                <span className="absolute inset-x-0 top-1/2 h-px bg-navy-300" />
              </span>
              {legendBooked}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-navy-100" />
              {legendClosed}
            </span>
          </div>
        </>
      )}
    </div>
  );
}