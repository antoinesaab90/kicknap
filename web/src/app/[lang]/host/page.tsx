import Link from "next/link";
import { lang } from "next/root-params";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireHost } from "@/lib/host";
import { serviceBaseUrl } from "@/lib/api";
import { formatEuro, formatDateTime } from "@/lib/format";
import type { HostSpacesResponse } from "@/lib/types/host";

export default async function HostDashboardPage() {
  const currentLang = await lang();
  const dict = await getDictionary();
  const host = await requireHost();

  if (!host) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-navy-900 sm:text-3xl">
          {dict.host.loginTitle}
        </h1>
        <p className="mt-3 text-navy-600">{dict.host.loginText}</p>
        <Link
          href={`/${currentLang}/login?next=/${currentLang}/host`}
          className="mt-8 inline-block rounded-full bg-navy-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
        >
          {dict.nav.login}
        </Link>
      </div>
    );
  }

  let spaces: HostSpacesResponse["spaces"] = [];
  let fetchError = false;
  try {
    const res = await fetch(
      `${serviceBaseUrl("listings")}/api/v1/spaces?host=${encodeURIComponent(host.email)}`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data = (await res.json()) as HostSpacesResponse;
      spaces = data.spaces;
    } else {
      fetchError = true;
    }
  } catch {
    fetchError = true;
  }

  let payoutsReady = false;
  let payoutsError = false;
  try {
    const res = await fetch(
      `${serviceBaseUrl("payments")}/api/v1/payments/accounts/${encodeURIComponent(host.email)}`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data = (await res.json()) as { account: { onboarded: boolean; payoutsEnabled: boolean } | null };
      payoutsReady = data.account?.onboarded === true && data.account.payoutsEnabled === true;
    } else if (res.status === 503) {
      payoutsError = true;
    }
  } catch {
    payoutsError = true;
  }

  type EarningsBooking = {
    id: number;
    spaceName: string;
    neighborhood: string;
    guestName: string;
    fromIso: string;
    toIso: string;
    priceCents: number;
    bookingStatus: string;
    paymentStatus: string;
    hostPayoutCents: number;
  };
  type EarningsResponse = {
    totals: { bookings: number; paid: number; earnedCents: number };
    bookings: EarningsBooking[];
  };
  let earnings: EarningsResponse | null = null;
  let earningsError = false;
  try {
    const res = await fetch(`/api/host/earnings`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      earnings = (await res.json()) as EarningsResponse;
    } else {
      earningsError = true;
    }
  } catch {
    earningsError = true;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-navy-900">
            {dict.host.title}
          </h1>
          <p className="mt-2 text-navy-600">{dict.host.subtitle}</p>
        </div>
        <Link
          href={`/${currentLang}/host/new`}
          className="rounded-full bg-gold-600 px-6 py-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold"
        >
          + {dict.host.listSpace}
        </Link>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-navy-100 bg-white p-6">
          <div>
            <h2 className="font-semibold text-navy-900">{dict.host.payoutsTitle}</h2>
            <p className="mt-1 text-sm text-navy-600">{dict.host.payoutsText}</p>
          </div>
          {payoutsError ? (
            <span className="text-sm font-medium text-navy-500">{dict.host.payoutsUnavailable}</span>
          ) : payoutsReady ? (
            <span className="inline-block rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700">
              {dict.host.payoutsReady}
            </span>
          ) : (
            <form action={`/api/host/payouts`} method="POST">
              <button
                type="submit"
                className="rounded-full bg-navy-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
              >
                {dict.host.payoutsSetup}
              </button>
            </form>
          )}
        </div>

        {earnings ? (
          <div className="rounded-3xl border border-navy-100 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-navy-900">{dict.host.earningsTitle}</h2>
                <p className="mt-1 text-sm text-navy-600">{dict.host.earningsSubtitle}</p>
                <p className="mt-0.5 text-xs text-navy-500">{dict.host.earningsHint}</p>
              </div>
              <p className="text-2xl font-semibold text-navy-900">
                {formatEuro(earnings.totals.earnedCents)}
              </p>
            </div>
            {earnings.totals.bookings === 0 ? (
              <p className="mt-5 text-sm text-navy-600">{dict.host.earningsEmpty}</p>
            ) : (
              <div className="mt-5 overflow-x-auto rounded-2xl border border-navy-100">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-navy-50 text-xs uppercase tracking-wide text-navy-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">{dict.host.earnSpace}</th>
                      <th className="px-4 py-3 font-semibold">{dict.host.earnWhen}</th>
                      <th className="px-4 py-3 font-semibold">{dict.host.earnGuest}</th>
                      <th className="px-4 py-3 text-right font-semibold">{dict.host.earnAmount}</th>
                      <th className="px-4 py-3 text-right font-semibold">{dict.host.earnStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100">
                    {earnings.bookings.map((b) => (
                      <tr key={b.id}>
                        <td className="px-4 py-3 text-navy-800">
                          <span className="font-semibold">{b.spaceName}</span>
                          <span className="ml-1 text-xs text-navy-500">{b.neighborhood}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-navy-700">
                          {formatDateTime(b.fromIso, currentLang)}
                        </td>
                        <td className="px-4 py-3 text-navy-700">{b.guestName || "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold text-navy-900">
                          {formatEuro(b.priceCents)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              b.paymentStatus === "succeeded"
                                ? "bg-emerald-50 text-emerald-700"
                                : b.paymentStatus === "failed"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-navy-100 text-navy-600"
                            }`}
                          >
                            {dict.host[`pay${b.paymentStatus}` as keyof typeof dict.host] ??
                              b.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : earningsError ? (
          <div className="rounded-3xl border border-navy-100 bg-navy-50/60 p-10 text-center text-navy-700">
            {dict.host.earningsUnavailable}
          </div>
        ) : null}

        {fetchError ? (
          <div className="rounded-3xl border border-navy-100 bg-navy-50/60 p-10 text-center text-navy-700">
            {dict.bookings.fetchError}
          </div>
        ) : spaces.length === 0 ? (
          <div className="rounded-3xl border border-navy-100 bg-navy-50/60 p-10 text-center">
            <h2 className="text-lg font-semibold text-navy-900">{dict.host.empty}</h2>
            <p className="mt-2 text-navy-600">{dict.host.emptyText}</p>
            <Link
              href={`/${currentLang}/host/new`}
              className="mt-6 inline-block rounded-full bg-navy-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
            >
              + {dict.host.listSpace}
            </Link>
          </div>
        ) : (
          spaces.map((space) => (
            <Link
              key={space.id}
              href={`/${currentLang}/host/spaces/${space.id}`}
              className="block rounded-3xl border border-navy-100 bg-white p-6 transition-colors hover:border-navy-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-navy-900">{space.name}</h2>
                  <p className="mt-1 text-sm text-navy-600">
                    {space.neighborhood} · {space.city}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-navy-900">
                    {formatEuro(space.hourlyPriceCents)}
                    <span className="text-sm font-medium text-navy-600">/h</span>
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      space.published
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-navy-100 text-navy-600"
                    }`}
                  >
                    {space.published ? dict.host.statusLive : dict.host.statusDraft}
                  </span>
                  <p className="mt-3 text-sm font-medium text-navy-700">
                    <span className="text-navy-500">{dict.host.edit}</span>{" "}
                    <span className="mx-1 text-navy-300">·</span>{" "}
                    <Link
                      href={`/${currentLang}/spaces/${space.id}`}
                      className="inline-block transition-colors hover:text-navy-900"
                    >
                      {dict.host.publicPage} ↗
                    </Link>
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}