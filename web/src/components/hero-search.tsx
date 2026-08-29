"use client";

import { useMemo, useState } from "react";

export interface HeroSearchTexts {
  whereLabel: string;
  whereValue: string;
  whenLabel: string;
  whenValue: string;
  whoLabel: string;
  whoValue: string;
  button: string;
  recents: string;
  popular: string;
  nearby: string;
  typeHere: string;
  noMatch: string;
  flexibility: string;
  noFlex: string;
  flex1: string;
  flex2: string;
  flex4: string;
  duration: string;
  hoursSuffix: string;
  done: string;
  guestsWord: string;
  petsWord: string;
  adults: string;
  children: string;
  pets: string;
  neighborhoods: Record<string, string>;
}

interface SavedDestination {
  label: string;
  area: string | null;
}

type OpenCell = "where" | "when" | "who" | null;

const RECENT_KEY = "kicknap-recent";

const CITY_DESTINATIONS: { label: string }[] = [
  { label: "Amsterdam" },
  { label: "Utrecht" },
  { label: "Rotterdam" },
  { label: "Den Haag" },
  { label: "Eindhoven" },
];

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function weekdayNames(lang: string): string[] {
  const fmt = new Intl.DateTimeFormat(lang === "nl" ? "nl-NL" : "en-GB", {
    weekday: "narrow",
    timeZone: "UTC",
  });
  return WEEKDAYS.map((_, i) => fmt.format(new Date(Date.UTC(2026, 0, i + 5))));
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

function localDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function loadRecents(): SavedDestination[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (r): r is SavedDestination =>
          r !== null &&
          typeof r === "object" &&
          typeof (r as SavedDestination).label === "string"
      )
      .slice(0, 5);
  } catch {
    return [];
  }
}

function saveRecents(list: SavedDestination[]): void {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)));
  } catch {
    // ignore
  }
}

export function HeroSearch({
  lang,
  texts,
}: {
  lang: string;
  texts: HeroSearchTexts;
}) {
  const [open, setOpen] = useState<OpenCell>(null);
  const [whereQuery, setWhereQuery] = useState("");
  const [location, setLocation] = useState<SavedDestination | null>(null);
  const [recent, setRecent] = useState<SavedDestination[]>([]);

  const todayStr = useMemo(() => localDateStr(), []);
  const [todayY, todayM] = todayStr.split("-").map(Number);
  const [month, setMonth] = useState({ y: todayY, m: todayM - 1 });
  const [date, setDate] = useState("");
  const [flexHours, setFlexHours] = useState(0);
  const [duration, setDuration] = useState(2);

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);

  const close = () => setOpen(null);

  function toggle(cell: OpenCell) {
    if (cell === open) {
      setOpen(null);
      return;
    }
    if (cell === "where") setRecent(loadRecents());
    setOpen(cell);
  }

  const destinations = useMemo(() => {
    const areas: SavedDestination[] = [
      { label: texts.nearby, area: null },
      ...(["centrum", "oost", "west", "zuid", "noord", "schiphol"] as const)
        .filter((a) => a !== "schiphol")
        .map((a) => ({ label: texts.neighborhoods[a], area: a })),
      { label: texts.neighborhoods.schiphol, area: "schiphol" },
      ...CITY_DESTINATIONS.map((c) => ({ label: c.label, area: null })),
    ];
    const q = whereQuery.trim().toLowerCase();
    if (!q) return areas;
    return areas.filter((d) => d.label.toLowerCase().includes(q));
  }, [whereQuery, texts]);

  function pickDestination(dest: SavedDestination) {
    setLocation(dest);
    const next = [dest, ...loadRecents().filter((r) => r.label !== dest.label)].slice(0, 5);
    setRecent(next);
    saveRecents(next);
    setWhereQuery("");
    setOpen(null);
  }

  const dateLabel = date
    ? new Intl.DateTimeFormat(lang === "nl" ? "nl-NL" : "en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(new Date(`${date}T00:00:00Z`))
    : texts.whenValue;

  const whoValue =
    adults > 1 || children > 0 || pets > 0
      ? `${adults + children} ${texts.guestsWord}${pets > 0 ? ` · ${pets} ${texts.petsWord}` : ""}`
      : texts.whoValue;

  const flexOptions = [
    { label: texts.noFlex, v: 0 },
    { label: texts.flex1, v: 1 },
    { label: texts.flex2, v: 2 },
    { label: texts.flex4, v: 4 },
  ];

  const cellClass = (active: boolean) =>
    `group relative flex-1 rounded-full px-5 py-3 text-left transition-colors ${
      active ? "bg-navy-50" : "hover:bg-navy-50"
    }`;
  const cellLabel =
    "block text-[11px] font-semibold uppercase tracking-wide text-navy-600";
  const cellValue = (placeholder: boolean) =>
    `mt-0.5 block truncate text-sm font-medium ${
      placeholder ? "text-navy-400" : "text-navy-900"
    }`;

  const firstWeekday = new Date(Date.UTC(month.y, month.m, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
  const leadingBlanks = (firstWeekday + 6) % 7;

  return (
    <form
      role="search"
      action={`/${lang}/search`}
      method="get"
      className="relative mx-auto mt-12 max-w-4xl"
    >
      <input type="hidden" name="area" value={location?.area ?? ""} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="hours" value={String(duration)} />
      <input type="hidden" name="flex" value={String(flexHours)} />
      <input type="hidden" name="adults" value={String(adults)} />
      <input type="hidden" name="children" value={String(children)} />
      <input type="hidden" name="pets" value={String(pets)} />

      <div className="flex w-full flex-col gap-2 rounded-[2rem] border border-navy-100 bg-white p-2 sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:py-2 sm:pr-2 sm:shadow-none sm:ring-1 sm:ring-navy-100 sm:shadow-xl sm:shadow-navy-900/5">
        {/* Where */}
        <div className={`${cellClass(open === "where")} sm:border-r sm:border-navy-100`}>
          <button type="button" onClick={() => toggle("where")} className="block w-full text-left" aria-expanded={open === "where"}>
            <span className={cellLabel}>{texts.whereLabel}</span>
            <span className={cellValue(!location)}>{location?.label ?? texts.whereValue}</span>
          </button>
        </div>

        {/* When */}
        <div className={`${cellClass(open === "when")} sm:border-r sm:border-navy-100`}>
          <button type="button" onClick={() => toggle("when")} className="block w-full text-left" aria-expanded={open === "when"}>
            <span className={cellLabel}>{texts.whenLabel}</span>
            <span className={cellValue(!date)}>{dateLabel}</span>
          </button>
        </div>

        {/* Who */}
        <div className={cellClass(open === "who")}>
          <button type="button" onClick={() => toggle("who")} className="block w-full text-left" aria-expanded={open === "who"}>
            <span className={cellLabel}>{texts.whoLabel}</span>
            <span className={cellValue(adults === 1 && children === 0 && pets === 0)}>{whoValue}</span>
          </button>
        </div>

        <div className="px-3 py-2 sm:px-2 sm:py-0">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-navy-800 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 sm:w-auto"
          >
            <SearchIcon className="h-4 w-4" />
            {texts.button}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-30" onClick={close} aria-hidden="true" />
      )}

      {/* Where dropdown */}
      {open === "where" && (
        <div className="absolute left-0 right-0 top-full z-40 mt-3 rounded-3xl border border-navy-100 bg-white p-4 shadow-xl" role="dialog">
          <input
            autoFocus
            type="text"
            value={whereQuery}
            onChange={(e) => setWhereQuery(e.target.value)}
            placeholder={texts.typeHere}
            className="w-full rounded-2xl border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-900 outline-none focus:border-navy-500"
          />

          <div className="mt-3 max-h-80 space-y-4 overflow-y-auto pr-1">
            {!whereQuery.trim() && recent.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-500">
                  {texts.recents}
                </p>
                <ul className="mt-1.5">
                  {recent.map((r) => (
                    <li key={r.label}>
                      <button
                        type="button"
                        onClick={() => pickDestination(r)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-navy-800 transition-colors hover:bg-navy-50"
                      >
                        <ClockIcon className="h-4 w-4 text-navy-400" />
                        {r.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-500">
                {texts.popular}
              </p>
              {destinations.length === 0 ? (
                <p className="mt-2 px-3 text-sm text-navy-500">{texts.noMatch}</p>
              ) : (
                <ul className="mt-1.5">
                  {destinations.map((d) => (
                    <li key={d.label}>
                      <button
                        type="button"
                        onClick={() => pickDestination(d)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-navy-800 transition-colors hover:bg-navy-50"
                      >
                        <PinIcon className="h-4 w-4 text-navy-400" />
                        {d.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* When dropdown */}
      {open === "when" && (
        <div
          className="absolute left-1/2 top-full z-40 mt-3 w-[22rem] max-w-full -translate-x-1/2 rounded-3xl border border-navy-100 bg-white p-4 shadow-xl"
          role="dialog"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              disabled={month.y === todayY && month.m === todayM}
              onClick={() =>
                setMonth((m) => (m.m === 0 ? { y: m.y - 1, m: 11 } : { y: m.y, m: m.m - 1 }))
              }
              className="flex h-8 w-8 items-center justify-center rounded-full text-navy-600 transition-colors hover:bg-navy-100 disabled:opacity-30"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="text-sm font-semibold text-navy-900">{monthLabel(month.y, month.m, lang)}</p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() =>
                setMonth((m) => (m.m === 11 ? { y: m.y + 1, m: 0 } : { y: m.y, m: m.m + 1 }))
              }
              className="flex h-8 w-8 items-center justify-center rounded-full text-navy-600 transition-colors hover:bg-navy-100"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M8 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-navy-500">
            {weekdayNames(lang).map((name, i) => (
              <span key={i} className="py-1">{name}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }, (_, i) => (
              <span key={`b${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const ds = dateStr(month.y, month.m, day);
              const past = ds < todayStr;
              const selected = ds === date;
              const isToday = ds === todayStr;
              return (
                <span key={ds} className="flex justify-center">
                  <button
                    type="button"
                    disabled={past}
                    onClick={() => setDate(ds)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors ${
                      past
                        ? "cursor-not-allowed text-navy-100"
                        : selected
                          ? "bg-navy-800 font-semibold text-white"
                          : "font-medium text-navy-900 hover:bg-gold-100"
                    } ${isToday && !selected ? "ring-1 ring-navy-400" : ""}`}
                  >
                    {day}
                  </button>
                </span>
              );
            })}
          </div>

          <div className="mt-4 border-t border-navy-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">
              {texts.flexibility}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {flexOptions.map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setFlexHours(opt.v as 0 | 1 | 2 | 4)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    flexHours === opt.v
                      ? "border-navy-800 bg-navy-800 text-white"
                      : "border-navy-200 text-navy-700 hover:border-navy-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-navy-100 pt-3">
            <span className="text-sm text-navy-700">{texts.duration}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="−"
                disabled={duration <= 1}
                onClick={() => setDuration((v) => Math.max(1, v - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-navy-200 text-navy-800 transition-colors hover:border-navy-400 disabled:opacity-40"
              >
                −
              </button>
              <span className="w-13 text-center text-sm font-semibold text-navy-900">
                {duration}h
              </span>
              <button
                type="button"
                aria-label="+"
                disabled={duration >= 12}
                onClick={() => setDuration((v) => Math.min(12, v + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-navy-200 text-navy-800 transition-colors hover:border-navy-400 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            className="mt-4 w-full rounded-full bg-navy-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
          >
            {texts.done}
          </button>
        </div>
      )}

      {/* Who dropdown */}
      {open === "who" && (
        <div
          className="absolute right-0 top-full z-40 mt-3 w-full max-w-xs rounded-3xl border border-navy-100 bg-white p-4 shadow-xl"
          role="dialog"
        >
          <GuestRow
            label={texts.adults}
            value={adults}
            min={1}
            max={8}
            onChange={setAdults}
          />
          <div className="mt-px" />
          <GuestRow
            label={texts.children}
            value={children}
            min={0}
            max={8}
            onChange={setChildren}
          />
          <div className="mt-px" />
          <GuestRow label={texts.pets} value={pets} min={0} max={2} onChange={setPets} />

          <button
            type="button"
            onClick={close}
            className="mt-4 w-full rounded-full bg-navy-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
          >
            {texts.done}
          </button>
        </div>
      )}
    </form>
  );
}

function GuestRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-navy-800">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`${label} −`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-navy-200 text-navy-800 transition-colors hover:border-navy-400 disabled:opacity-40"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-semibold text-navy-900">{value}</span>
        <button
          type="button"
          aria-label={`${label} +`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-navy-200 text-navy-800 transition-colors hover:border-navy-400 disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path
        d="M12 21s7-5.1 7-11a7 7 0 0 0-14 0c0 5.9 7 11 7 11Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}