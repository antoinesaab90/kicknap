"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatEuro, amsterdamOffset, localDateString } from "@/lib/format";
import { computeBreakdown, formatDuration } from "@/lib/price";
import type { BookingDto, BookingErrorCode } from "@/lib/types/booking";
import type { CheckoutResponse } from "@/lib/types/payments";

export interface BookingTexts {
  date: string;
  from: string;
  duration: string;
  hours: string;
  check: string;
  checking: string;
  available: string;
  unavailable: string;
  reason_outside_opening_hours: string;
  reason_no_opening_hours: string;
  reason_shorter_than_min: string;
  reason_longer_than_max: string;
  reason_already_booked: string;
  reason_space_not_found: string;
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
  breakdownVat: string;
  breakdownFee: string;
  breakdownTotal: string;
  fixedSession: string;
}

type CheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ok"; available: true }
  | { status: "no"; available: false; reason?: BookingErrorCode | "unknown" };

export function BookingPanel({
  spaceId,
  hourlyRateCents,
  minHours,
  maxHours,
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
  lang: string;
  isLoggedIn: boolean;
  loginHref: string;
  bookingsHref: string;
  texts: BookingTexts;
}) {
  const router = useRouter();
  const today = useMemo(() => localDateString(new Date()), []);
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("09:00");
  const [hours, setHours] = useState(minHours);
  const [check, setCheck] = useState<CheckState>({ status: "idle" });
  const [booking, setBooking] = useState<BookingDto | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const isFixed = minHours === maxHours;
  const estimate = isFixed
    ? computeBreakdown(minHours * 60, hourlyRateCents)
    : computeBreakdown(hours * 60, hourlyRateCents);
  const estimateCents = estimate.totalCents;
  const sessionLabel = isFixed ? texts.fixedSession.replace("{h}", String(minHours)) : null;

  const hourOptions = useMemo(() => {
    const from = Math.max(1, Math.round(minHours));
    const to = Math.min(24, Math.max(from, Math.round(maxHours)));
    const options: number[] = [];
    for (let h = from; h <= to; h += 1) options.push(h);
    return options;
  }, [minHours, maxHours]);

  function buildRange(): { from: string; to: string } {
    const offset = amsterdamOffset(date);
    const from = `${date}T${startTime}:00:00${offset}`;
    const toMs = Date.parse(from) + hours * 3600 * 1000;
    return { from, to: new Date(toMs).toISOString() };
  }

  async function runCheck() {
    setCheck({ status: "checking" });
    const { from, to } = buildRange();
    try {
      const res = await fetch(`/api/availability?spaceId=${spaceId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      const data = (await res.json()) as { available?: boolean; reason?: string };
      if (data.available) {
        setCheck({ status: "ok", available: true });
      } else {
        setCheck({
          status: "no",
          available: false,
          reason: (data.reason as BookingErrorCode) ?? "unknown",
        });
      }
    } catch {
      setCheck({ status: "no", available: false, reason: "unknown" });
    }
  }

  async function submitBooking() {
    setSubmitting(true);
    setBookingError(null);
    const { from, to } = buildRange();
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ spaceId, from, to }),
      });
      if (res.status === 401) {
        router.push(loginHref);
        return;
      }
      const data = (await res.json()) as { booking?: BookingDto; error?: BookingErrorCode };
      if (res.ok && data.booking) {
        setBooking(data.booking);
        setCheck({ status: "idle" });
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
      default:
        return texts.unavailable;
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
            {formatEuro(booking.priceCents)}
            <span className="text-navy-600"> · {booking.durationMinutes / 60}h</span>
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
              setCheck({ status: "idle" });
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
        {isFixed ? formatEuro(estimateCents) : formatEuro(hourlyRateCents)}
        <span className="font-normal">{isFixed ? ` ${sessionLabel}` : texts.perHour}</span>
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-navy-600">
          {texts.date}
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => {
              setDate(e.target.value || today);
              setCheck({ status: "idle" });
            }}
            className="mt-1 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-gold-600 focus:outline-none"
          />
        </label>
        <label className="text-xs font-medium text-navy-600">
          {texts.from}
          <input
            type="time"
            value={startTime}
            step={3600}
            onChange={(e) => {
              setStartTime(e.target.value || "09:00");
              setCheck({ status: "idle" });
            }}
            className="mt-1 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-gold-600 focus:outline-none"
          />
        </label>
      </div>

      <label className="mt-3 block text-xs font-medium text-navy-600">
        {texts.duration}
        <select
          value={hours}
          onChange={(e) => {
            setHours(Number(e.target.value));
            setCheck({ status: "idle" });
          }}
          className="mt-1 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-gold-600 focus:outline-none"
        >
          {hourOptions.map((h) => (
            <option key={h} value={h}>
              {h} {texts.hours}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={runCheck}
        disabled={check.status === "checking"}
        className="mt-4 w-full rounded-full border border-navy-300 px-5 py-3 text-sm font-semibold text-navy-800 transition-colors hover:border-navy-500 disabled:opacity-60"
      >
        {check.status === "checking" ? texts.checking : texts.check}
      </button>

      {check.status === "ok" && (
        <p className="mt-3 text-sm font-medium text-emerald-700">{texts.available}</p>
      )}
      {check.status === "no" && (
        <p className="mt-3 text-sm font-medium text-rose-700">{reasonText(check.reason ?? "unknown")}</p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-navy-100 pt-4">
        <span className="text-sm text-navy-600">{texts.total}</span>
        <span className="flex items-center gap-2 text-navy-700">
          {!isFixed && (
            <span className="text-xs text-navy-600">
              ({formatDuration(hours * 60)})
            </span>
          )}
          <span className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowBreakdown(true)}
              onMouseLeave={() => setShowBreakdown(false)}
              onClick={() => setShowBreakdown((v) => !v)}
              className="text-lg font-semibold text-gold-600 underline decoration-dotted underline-offset-4 transition-colors"
            >
              ≈ {formatEuro(estimateCents)}
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
                    <span>{texts.breakdownVat}</span>
                    <span>{formatEuro(estimate.taxCents)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>{texts.breakdownFee}</span>
                    <span>{formatEuro(estimate.feeCents)}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-3 border-t border-navy-100 pt-2 font-semibold text-navy-900">
                    <span>{texts.breakdownTotal}</span>
                    <span>{formatEuro(estimate.totalCents)}</span>
                  </div>
                </div>
              </div>
            )}
          </span>
        </span>
      </div>

      {isLoggedIn ? (
        <button
          type="button"
          onClick={submitBooking}
          disabled={submitting || check.status !== "ok"}
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

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-navy-100 bg-white p-6 shadow-sm">{children}</div>
  );
}