import Link from "next/link";
import { lang } from "next/root-params";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { fetchSpace } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { formatEuro } from "@/lib/format";
import { allInHourlyCents, computeBreakdown } from "@/lib/price";
import { BookingPanel } from "@/components/booking-panel";
import type { BookingTexts } from "@/components/booking-panel";

export default async function SpacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentLang = await lang();
  const dict = await getDictionary();
  const { id } = await params;
  const spaceId = Number(id);
  const session = await getSession();

  const space = Number.isInteger(spaceId) ? await fetchSpace(spaceId) : null;
  const notFound = !space || !space.published;

  if (notFound) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-navy-900 sm:text-3xl">
          {dict.space.notFoundTitle}
        </h1>
        <p className="mt-3 text-navy-600">{dict.space.notFoundText}</p>
        <Link
          href={`/${currentLang}/search`}
          className="mt-8 inline-block rounded-full bg-navy-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
        >
          {dict.space.backToSearch}
        </Link>
      </div>
    );
  }

  const texts: BookingTexts = {
    unavailable: dict.space.unavailable,
    reason_outside_opening_hours: dict.space.reason_outside_opening_hours,
    reason_no_opening_hours: dict.space.reason_no_opening_hours,
    reason_shorter_than_min: dict.space.reason_shorter_than_min,
    reason_longer_than_max: dict.space.reason_longer_than_max,
    reason_already_booked: dict.space.reason_already_booked,
    reason_space_not_found: dict.space.reason_space_not_found,
    total: dict.space.total,
    perHour: dict.space.perHour,
    book: dict.space.book,
    signInToBook: dict.space.signInToBook,
    bookingNote: dict.space.bookingNote,
    bookedTitle: dict.space.bookedTitle,
    bookedText: dict.space.bookedText,
    viewBookings: dict.space.viewBookings,
    bookAnother: dict.space.bookAnother,
    payTitle: dict.space.payTitle,
    payNow: dict.space.payNow,
    paying: dict.space.paying,
    paymentFailed: dict.space.paymentFailed,
    priceBreakdown: dict.space.priceBreakdown,
    breakdownRental: dict.space.breakdownRental,
    breakdownFee: dict.space.breakdownFee,
    breakdownTotal: dict.space.breakdownTotal,
    fixedSession: dict.space.fixedSession,
    pickDayHint: dict.space.pickDayHint,
    sessionAvailable: dict.space.sessionAvailable,
    startTime: dict.space.startTime,
    endTime: dict.space.endTime,
    noSession: dict.space.noSession,
    noFreeTime: dict.space.noFreeTime,
    legendAvailable: dict.space.legendAvailable,
    legendBooked: dict.space.legendBooked,
    legendClosed: dict.space.legendClosed,
    prevMonth: dict.space.prevMonth,
    nextMonth: dict.space.nextMonth,
  };

  const isFixed = space.minHours === space.maxHours;
  const fixedSessionCents = isFixed
    ? computeBreakdown(space.minHours * 60, space.hourlyPriceCents).totalCents
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href={`/${currentLang}/search`}
        className="inline-block text-sm font-medium text-navy-600 transition-colors hover:text-navy-900"
      >
        ← {dict.space.backToSearch}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div>
          <div className="relative h-80 overflow-hidden rounded-3xl bg-navy-100">
            {space.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={space.photoUrl}
                alt={space.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-5xl font-semibold text-navy-300">
                  {space.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {space.isDemo && (
              <span className="absolute left-4 top-4 rounded-full bg-navy-800/85 px-3 py-1 text-xs font-semibold text-white">
                {dict.search.demoNote}
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-navy-900">
                {space.name}
              </h1>
              <p className="mt-2 text-navy-600">
                {space.neighborhood} · {space.city}
              </p>
              {space.timesRated > 0 && (
                <p className="mt-1 text-sm text-navy-700">
                  ★ {space.rating.toFixed(1)}{" "}
                  <span className="text-navy-500">
                    · {space.timesRated} {dict.space.reviews}
                  </span>
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-navy-900">
                {isFixed
                  ? formatEuro(fixedSessionCents ?? 0)
                  : formatEuro(allInHourlyCents(space.hourlyPriceCents))}
                <span className="text-sm font-medium text-navy-600">
                  {isFixed ? ` ${dict.space.fixedSession.replace("{h}", String(space.minHours))}` : dict.space.perHour}
                </span>
              </p>
              {!isFixed && (
                <p className="mt-1 text-sm text-navy-600">
                  {dict.space.minStay} {space.minHours}h · {dict.space.maxStay} {space.maxHours}h
                </p>
              )}
            </div>
          </div>

          {space.description && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-navy-900">{dict.space.about}</h2>
              <p className="mt-3 max-w-prose leading-relaxed text-navy-700">
                {space.description}
              </p>
            </section>
          )}

          <section className="mt-8 border-t border-navy-100 pt-6">
            <h2 className="text-lg font-semibold text-navy-900">{dict.space.location}</h2>
            <p className="mt-2 text-navy-700">
              {space.address ?? space.name}, {space.city}
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingPanel
            spaceId={space.id}
            hourlyRateCents={space.hourlyPriceCents}
            minHours={space.minHours}
            maxHours={space.maxHours}
            lang={currentLang}
            isLoggedIn={Boolean(session?.token)}
            loginHref={`/${currentLang}/login?next=/${currentLang}/spaces/${space.id}`}
            bookingsHref={`/${currentLang}/bookings`}
            texts={texts}
          />
        </aside>
      </div>
    </div>
  );
}