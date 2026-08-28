import Link from "next/link";
import { lang } from "next/root-params";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { clearSession, getSession } from "@/lib/auth";
import { identifyUser, fetchSpace, serviceBaseUrl } from "@/lib/api";
import { formatEuro, formatDateTime } from "@/lib/format";
import type { BookingsResponse } from "@/lib/types/booking";

export default async function MyBookingsPage() {
  const currentLang = await lang();
  const dict = await getDictionary();
  const session = await getSession();

  if (!session) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-navy-900 sm:text-3xl">
          {dict.bookings.notLoggedInTitle}
        </h1>
        <Link
          href={`/${currentLang}/login?next=/${currentLang}/bookings`}
          className="mt-8 inline-block rounded-full bg-navy-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
        >
          {dict.nav.login}
        </Link>
      </div>
    );
  }

  const user = await identifyUser(session.token);
  if (!user) {
    await clearSession();
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-navy-900 sm:text-3xl">
          {dict.bookings.notLoggedInTitle}
        </h1>
        <Link
          href={`/${currentLang}/login`}
          className="mt-8 inline-block rounded-full bg-navy-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
        >
          {dict.nav.login}
        </Link>
      </div>
    );
  }

  let bookings: BookingsResponse["bookings"] | null = null;
  let fetchError = false;
  try {
    const res = await fetch(
      `${serviceBaseUrl("bookings")}/api/v1/bookings?guestEmail=${encodeURIComponent(user.email)}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = (await res.json()) as BookingsResponse;
      bookings = data.bookings;
    } else {
      fetchError = true;
    }
  } catch {
    fetchError = true;
  }

  const rows = bookings === null ? [] : await Promise.all(
    bookings.map(async (booking) => {
      const spare = fetchSpace(booking.spaceId).then((space) => ({
        name: space?.name ?? `#${booking.spaceId}`,
      }));
      const status = fetch(
        `${serviceBaseUrl("payments")}/api/v1/payments/bookings/${booking.id}`,
        { cache: "no-store" }
      )
        .then((res) => (res.ok ? res.json() : ({ payment: null } as { payment: unknown })))
        .catch(() => ({ payment: null }) as { payment: unknown })
        .then((data) => {
          const p = (data as { payment?: { status?: string } }).payment;
          return p?.status === "succeeded" ? "paid" : p?.status === "failed" ? "failed" : "unpaid";
        });
      const [space, paymentStatus] = await Promise.all([spare, status]);
      return { booking, spaceName: space.name, paymentStatus };
    })
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">{dict.bookings.title}</h1>
      <p className="mt-2 text-navy-600">{dict.bookings.subtitle}</p>

      <div className="mt-8 space-y-4">
        {fetchError ? (
          <div className="rounded-3xl border border-navy-100 bg-navy-50/60 p-10 text-center text-navy-700">
            {dict.bookings.fetchError}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-navy-100 bg-navy-50/60 p-10 text-center">
            <h2 className="text-lg font-semibold text-navy-900">{dict.bookings.empty}</h2>
            <p className="mt-2 text-navy-600">{dict.bookings.emptyText}</p>
            <Link
              href={`/${currentLang}/search`}
              className="mt-6 inline-block rounded-full bg-navy-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
            >
              {dict.nav.spaces}
            </Link>
          </div>
        ) : (
          rows.map(({ booking, spaceName, paymentStatus }) => (
            <Link
              key={booking.id}
              href={`/${currentLang}/spaces/${booking.spaceId}`}
              className="block rounded-3xl border border-navy-100 bg-white p-6 transition-colors hover:border-navy-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-navy-900">{spaceName}</h2>
                  <p className="mt-1 text-sm text-navy-600">{booking.spaceId}</p>
                  <p className="mt-3 text-sm text-navy-700">
                    {dict.bookings.when}:{" "}
                    <span className="font-medium text-navy-900">
                      {formatDateTime(booking.from ?? booking.fromTs, currentLang)}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-navy-700">
                    {dict.bookings.duration}: {booking.durationMinutes / 60}h
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-navy-900">
                    {formatEuro(booking.priceCents)}
                  </p>
                  {paymentStatus === "paid" ? (
                    <span className="mt-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {dict.bookings.statusPaid}
                    </span>
                  ) : paymentStatus === "failed" ? (
                    <span className="mt-2 inline-block rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                      {dict.bookings.statusFailed}
                    </span>
                  ) : (
                    <span className="mt-2 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      {dict.bookings.statusUnpaid}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}