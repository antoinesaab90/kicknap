import Link from "next/link";
import { lang } from "next/root-params";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireHost } from "@/lib/host";
import { serviceBaseUrl } from "@/lib/api";
import { formatEuro } from "@/lib/format";
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
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
                  <p className="mt-3 text-sm font-medium text-navy-700">{dict.host.edit} →</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}