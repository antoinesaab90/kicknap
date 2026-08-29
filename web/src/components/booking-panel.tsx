"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { amsZonedIso, formatEuro } from "@/lib/format";
import { allInCents, allInHourlyCents, computeBreakdown, formatDuration } from "@/lib/price";
import {
  availableStartMinutes,
  dayState,
  freeIntervals,
  minutesToHm,
  nextDateStr,
  todayAmsterdamDate,
  windowsFromStart,
  type BookedWindow,
  type OpeningRule,
} from "@/lib/availability";
import { BookingCalendar } from "@/components/booking-calendar";
import type { BookingDto, BookingErrorCode } from "@/lib/types/booking";
import type { CheckoutResponse } from "@/lib/types/payments";

export interface BookingTexts {
  unavailable: string;
  reason_outside_opening_hours: string;
  reason_no_opening_hours: string;
  reason_shorter_than_min: string;
  reason_longer_than_max: string;
  reason_already_booked: string;
  reason_space_not_found: string;
  reason_adults_exceeded: string;
  reason_children_exceeded: string;
  reason_pets_not_allowed: string;
  total: string;
  perHour: string;
  book: string;
  signInToBook: string;
  bookingNote: string;
  bookedTitle: string;
  bookedText: string;
  viewBookings: string;
  bookAnother: string;
  payTitle: string;
  payNow: string;
  paying: string;
  paymentFailed: string;
  priceBreakdown: string;
  breakdownRental: string;
  breakdownFee: string;
  breakdownTotal: string;
  fixedSession: string;
  pickDayHint: string;
  sessionAvailable: string;
  startTime: string;
  endTime: string;
  noSession: string;
  noFreeTime: string;
  legendAvailable: string;
  legendBooked: string;
  legendClosed: string;
  prevMonth: string;
  nextMonth: string;
  guestsLabel: string;
  guestsAdults: string;
  guestsChildren: string;
  guestsPets: string;
}

export function BookingPanel({
  spaceId,
  hourlyRateCents,
  minHours,
  maxHours,
  maxAdults,
  maxChildren,
  petsAllowed,
  lang,
  isLoggedIn,
  loginHref,
  bookingsHref,
  texts,
}: {
  spaceId: number;
  hourlyRateCents: number;
  minHours: number;
  maxHours: number;
  maxAdults: number;
  maxChildren: number;
  petsAllowed: boolean;
  lang: string;
  isLoggedIn: boolean;
  loginHref: string;
  bookingsHref: string;
  texts: BookingTexts;
}) {
  const router = useRouter();
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);
  const todayAms = useMemo(() => todayAmsterdamDate(), []);
  const initialMonth = useMemo(() => {
    const [y, m] = todayAms.split("-").map(Number);
    return { y, m: m - 1 };
  }, [todayAms]);

  const [month, setMonth] = useState(initialMonth);
  const [rules, setRules] = useState<OpeningRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [booked, setBooked] = useState<BookedWindow[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [startMin, setStartMin] = useState<number | null>(null);
  const [endMin, setEndMin] = useState<number | null>(null);
  const [booking, setBooking] = useState<BookingDto | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const isFixed = minHours === maxHours;

  useEffect(() => {
    let active = true;
    fetch(`/api/spaces/${spaceId}/hours`)
      .then((r) => r.json())
      .then((data: { rules?: OpeningRule[] }) => {
        if (active) {
          setRules(Array.isArray(data.rules) ? data.rules : []);
          setRulesLoading(false);
        }
      })
      .catch(() => {
        if (active) setRulesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [spaceId]);

  const monthFirst = useMemo(
    () => `${month.y}-${String(month.m + 1).padStart(2, "0")}-01`,
    [month]
  );
  const nextMonthFirst = useMemo(() => nextDateStr(monthFirst), [monthFirst]);

  useEffect(() => {
    let active = true;
    const fromIso = amsZonedIso(monthFirst, "00:00");
    const toIso = amsZonedIso(nextMonthFirst, "00:00");
    fetch(
      `/api/spaces/${spaceId}/bookings?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`
    )
      .then((r) => r.json())
      .then((data: { bookings?: { fromTs: string; toTs: string }[] }) => {
        if (active) {
          setBooked(
            Array.isArray(data.bookings)
              ? data.bookings.map((b) => ({ fromIso: b.fromTs, toIso: b.toTs }))
              : []
          );
        }
      })
      .catch(() => {
        /* keep previous data */
      });
    return () => {
      active = false;
    };
  }, [spaceId, monthFirst, nextMonthFirst]);

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

  const fixedSessions = useMemo(() => {
    if (!isFixed) return [];
    return selectedFree
      .filter((iv) => iv.end - iv.start >= minHours * 60)
      .map((iv) => ({ start: iv.start, end: iv.start + minHours * 60 }));
  }, [isFixed, selectedFree, minHours]);

  const pickDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setStartMin(null);
    setEndMin(null);
    setShowBreakdown(false);
    if (isFixed) {
      const free = freeIntervals(dateStr, rules, booked);
      const sessions = free
        .filter((iv) => iv.end - iv.start >= minHours * 60)
        .map((iv) => ({ start: iv.start, end: iv.start + minHours * 60 }));
      if (sessions.length === 1) {
        setStartMin(sessions[0].start);
        setEndMin(sessions[0].end);
      }
    } else {
      const free = freeIntervals(dateStr, rules, booked);
      const starts = availableStartMinutes(free, minHours);
      if (starts[0] !== undefined) {
        setStartMin(starts[0]);
        const ends = windowsFromStart(free, starts[0], minHours, maxHours);
        setEndMin(ends[0] ?? null);
      }
    }
  };

  const pickStart = (minutes: number) => {
    setStartMin(minutes);
    setShowBreakdown(false);
    const ends = windowsFromStart(selectedFree, minutes, minHours, maxHours);
    setEndMin(ends[0] ?? null);
  };

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

  const estimate = isFixed
    ? computeBreakdown(minHours * 60, hourlyRateCents)
    : startMin != null && endMin != null
      ? computeBreakdown(endMin - startMin, hourlyRateCents)
      : null;

  const sessionLabel = isFixed ? texts.fixedSession.replace("{h}", String(minHours)) : null;

  function reasonText(reason: BookingErrorCode | "unknown"): string {
    switch (reason) {
      case "outside_opening_hours":
        return texts.reason_outside_opening_hours;
      case "no_opening_hours":
        return texts.reason_no_opening_hours;
      case "shorter_than_min":
        return texts.reason_shorter_than_min;
      case "longer_than_max":
        return texts.reason_longer_than_max;
      case "slot_conflict":
      case "already_booked":
        return texts.reason_already_booked;
      case "space_not_found":
        return texts.reason_space_not_found;
      case "adults_exceeded":
        return texts.reason_adults_exceeded.replace("{max}", String(maxAdults));
      case "children_exceeded":
        return texts.reason_children_exceeded.replace("{max}", String(maxChildren));
      case "pets_not_allowed":
        return texts.reason_pets_not_allowed;
      default:
        return texts.unavailable;
    }
  }

  async function submitBooking() {
    if (!selectedDate || startMin == null || endMin == null) return;
    setSubmitting(true);
    setBookingError(null);
    const fromIso = amsZonedIso(selectedDate, minutesToHm(startMin));
    const toIso = amsZonedIso(selectedDate, minutesToHm(endMin));
    if (Date.parse(fromIso) <= Date.now()) {
      setBookingError(texts.unavailable);
      setSubmitting(false);
      return;
    }
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          spaceId,
          from: fromIso,
          to: toIso,
          guests: { adults, children, pets },
        }),
      });
      if (res.status === 401) {
        router.push(loginHref);
        return;
      }
      const data = (await res.json()) as { booking?: BookingDto; error?: BookingErrorCode };
      if (res.ok && data.booking) {
        setBooking(data.booking);
        await payForBooking(data.booking);
      } else {
        setBookingError(reasonText(data.error ?? "unknown"));
      }
    } catch {
      setBookingError(texts.unavailable);
    } finally {
      setSubmitting(false);
    }
  }

  async function payForBooking(bookingToPay: BookingDto) {
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingToPay.id,
          spaceId,
          lang,
        }),
      });
      if (res.status === 401) {
        router.push(loginHref);
        return;
      }
      const data = (await res.json()) as Partial<CheckoutResponse>;
      if (!res.ok || !data.url) {
        setPayError(texts.paymentFailed);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setPayError(texts.paymentFailed);
    } finally {
      setPaying(false);
    }
  }

  if (booking) {
    const fromLocal = new Intl.DateTimeFormat(lang === "nl" ? "nl-NL" : "en-GB", {
      timeZone: "Europe/Amsterdam",
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(booking.from ?? booking.fromTs));
    return (
      <Card>
        <p className="text-lg font-semibold text-navy-900">{texts.bookedTitle}</p>
        <p className="mt-2 text-sm leading-relaxed text-navy-600">
          {texts.bookedText.replace("{id}", String(booking.id))}
        </p>
        <div className="mt-4 rounded-2xl bg-navy-50 p-4 text-sm text-navy-700">
          <p className="font-medium text-navy-900">{fromLocal}</p>
          <p className="mt-1">
            {formatEuro(allInCents(booking.priceCents))}
            <span className="text-navy-600"> · {formatDuration(booking.durationMinutes)}</span>
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => payForBooking(booking)}
            disabled={paying}
            className="rounded-full bg-gold-600 px-5 py-3 text-center text-sm font-semibold text-navy-950 transition-colors hover:bg-gold disabled:opacity-50"
          >
            {paying ? texts.paying : texts.payNow}
          </button>
          {payError && <p className="text-sm font-medium text-rose-700">{payError}</p>}
          <a
            href={bookingsHref}
            className="rounded-full border border-navy-200 px-5 py-3 text-center text-sm font-semibold text-navy-700 transition-colors hover:border-navy-400"
          >
            {texts.viewBookings}
          </a>
          <button
            type="button"
            onClick={() => {
              setBooking(null);
            }}
            className="text-sm font-medium text-navy-600 underline-offset-2 hover:underline"
          >
            {texts.bookAnother}
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-sm font-semibold text-navy-600">
        {isFixed ? formatEuro(estimate?.totalCents ?? 0) : formatEuro(allInHourlyCents(hourlyRateCents))}
        <span className="font-normal">{isFixed ? ` ${sessionLabel}` : texts.perHour}</span>
      </p>

      <BookingCalendar
        year={month.y}
        month={month.m}
        selectedDate={selectedDate}
        todayDate={todayAms}
        lang={lang}
        loading={rulesLoading}
        prevLabel={texts.prevMonth}
        nextLabel={texts.nextMonth}
        legendAvailable={texts.legendAvailable}
        legendBooked={texts.legendBooked}
        legendClosed={texts.legendClosed}
        dayInfo={dayInfo}
        onSelect={pickDate}
        onPrev={() => setMonth((m) => (m.m === 0 ? { y: m.y - 1, m: 11 } : { y: m.y, m: m.m - 1 }))}
        onNext={() => setMonth((m) => (m.m === 11 ? { y: m.y + 1, m: 0 } : { y: m.y, m: m.m + 1 }))}
      />

      {selectedDate ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">
            {isFixed ? texts.sessionAvailable : texts.startTime}
          </p>

          {isFixed ? (
            fixedSessions.length === 0 ? (
              <p className="mt-2 text-sm text-navy-600">{texts.noSession}</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {fixedSessions.map((w) => (
                  <SlotChip
                    key={w.start}
                    label={`${minutesToHm(w.start)}–${minutesToHm(w.end)}`}
                    active={startMin === w.start && endMin === w.end}
                    onClick={() => {
                      setStartMin(w.start);
                      setEndMin(w.end);
                    }}
                  />
                ))}
              </div>
            )
          ) : (
            <div>
              {startOptions.length === 0 ? (
                <p className="mt-2 text-sm text-navy-600">{texts.noFreeTime}</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {startOptions.map((m) => (
                    <SlotChip
                      key={m}
                      label={minutesToHm(m)}
                      active={startMin === m}
                      onClick={() => pickStart(m)}
                    />
                  ))}
                </div>
              )}
              {startMin != null && endOptions.length > 1 && (
                <>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-navy-500">
                    {texts.endTime}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {endOptions.map((m) => (
                      <SlotChip
                        key={m}
                        label={minutesToHm(m)}
                        active={endMin === m}
                        onClick={() => setEndMin(m)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-navy-600">{texts.pickDayHint}</p>
      )}

      <div className="mt-4 border-t border-navy-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">
          {texts.guestsLabel}
        </p>
        <div className="mt-2 space-y-2">
          <GuestRow
            label={texts.guestsAdults}
            value={adults}
            min={1}
            max={Math.max(1, maxAdults)}
            onChange={setAdults}
          />
          <GuestRow
            label={texts.guestsChildren}
            value={children}
            min={0}
            max={Math.max(0, maxChildren)}
            onChange={setChildren}
          />
          {petsAllowed && (
            <GuestRow label={texts.guestsPets} value={pets} min={0} max={2} onChange={setPets} />
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-navy-100 pt-4">
        <span className="text-sm text-navy-600">{texts.total}</span>
        <span className="flex items-center gap-2 text-navy-700">
          {estimate && !isFixed && (
            <span className="text-xs text-navy-600">({formatDuration(estimate.minutes)})</span>
          )}
          {estimate ? (
            <span className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowBreakdown(true)}
                onMouseLeave={() => setShowBreakdown(false)}
                onClick={() => setShowBreakdown((v) => !v)}
                className="text-lg font-semibold text-gold-600 underline decoration-dotted underline-offset-4 transition-colors"
              >
                {formatEuro(estimate.totalCents)}
              </button>
              {showBreakdown && (
                <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-2xl border border-navy-100 bg-white p-4 shadow-xl">
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">
                    {texts.priceBreakdown}
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-navy-700">
                    <div className="flex justify-between gap-3">
                      <span>
                        {texts.breakdownRental.replace(
                          "{duration}",
                          formatDuration(estimate.minutes)
                        )}
                      </span>
                      <span className="font-semibold">{formatEuro(estimate.baseCents)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>{texts.breakdownFee}</span>
                      <span className="font-semibold">{formatEuro(estimate.feeCents)}</span>
                    </div>
                    <div className="mt-2 flex justify-between gap-3 border-t border-navy-100 pt-2 font-semibold text-navy-900">
                      <span>{texts.breakdownTotal}</span>
                      <span>{formatEuro(estimate.totalCents)}</span>
                    </div>
                  </div>
                </div>
              )}
            </span>
          ) : (
            <span className="text-lg font-semibold text-navy-900">—</span>
          )}
        </span>
      </div>

      {isLoggedIn ? (
        <button
          type="button"
          onClick={submitBooking}
          disabled={submitting || !estimate}
          className="mt-4 w-full rounded-full bg-gold-600 px-5 py-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold disabled:opacity-50"
        >
          {submitting ? "…" : texts.book}
        </button>
      ) : (
        <a
          href={loginHref}
          className="mt-4 block w-full rounded-full bg-navy-800 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-navy-700"
        >
          {texts.signInToBook}
        </a>
      )}

      {bookingError && <p className="mt-3 text-sm font-medium text-rose-700">{bookingError}</p>}

      <p className="mt-4 text-xs leading-relaxed text-navy-600">{texts.bookingNote}</p>
    </Card>
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
    <div className="flex items-center justify-between">
      <span className="text-sm text-navy-700">{label}</span>
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

function SlotChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-navy-900 px-3 py-1.5 text-sm font-semibold text-white"
          : "rounded-full border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-800 transition-colors hover:border-navy-400"
      }
    >
      {label}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-navy-100 bg-white p-6 shadow-sm">{children}</div>
  );
}