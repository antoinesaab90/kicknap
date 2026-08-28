import Link from "next/link";
import { lang } from "next/root-params";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { serviceBaseUrl } from "@/lib/api";
import { SpaceCard } from "@/components/space-card";
import { localDateString } from "@/lib/format";
import type { SpacesResponse } from "@/lib/types/space";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export default async function HomePage() {
  const dict = await getDictionary();
  const currentLang = await lang();

  let featured: SpacesResponse["spaces"] = [];
  try {
    const res = await fetch(
      `${serviceBaseUrl("listings")}/api/v1/spaces`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = (await res.json()) as SpacesResponse;
      featured = data.spaces.slice(0, 6);
    }
  } catch {
    featured = [];
  }

  const cardTexts = {
    perHour: dict.search.perHour,
    minHours: dict.search.minHours,
    demoNote: dict.search.demoNote,
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-navy-50 to-white">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
          <p className="text-sm font-medium uppercase tracking-widest text-gold-600">
            {dict.hero.eyebrow}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-navy-900 sm:text-6xl">
            {dict.hero.title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-navy-600">{dict.hero.tagline}</p>

          {/* Search bar — real GET form to /search */}
          <form
            role="search"
            action={`/${currentLang}/search`}
            method="get"
            className="mx-auto mt-12 flex max-w-2xl flex-col items-stretch gap-2 rounded-3xl border border-navy-100 bg-white p-3 shadow-xl shadow-navy-900/5 sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:border-0 sm:p-2 sm:shadow-none sm:ring-1 sm:ring-navy-100"
          >
            <label className="px-4 py-3 text-left sm:border-r sm:border-navy-100 sm:py-2 sm:px-5">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-navy-600">
                {dict.hero.search.where}
              </span>
              <select
                name="area"
                defaultValue=""
                className="mt-0.5 w-full bg-transparent text-sm text-navy-800 outline-none sm:w-auto"
              >
                <option value="">{dict.hero.search.allAreas}</option>
                {(["centrum", "oost", "west", "zuid", "noord", "schiphol"] as const).map((area) => (
                  <option key={area} value={area}>
                    {dict.search.neighborhoods[area]}
                  </option>
                ))}
              </select>
            </label>
            <label className="px-4 py-3 text-left sm:border-r sm:border-navy-100 sm:py-2 sm:px-5">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-navy-600">
                {dict.hero.search.when}
              </span>
              <input
                type="date"
                name="date"
                min={localDateString(new Date())}
                className="mt-0.5 w-full bg-transparent text-sm text-navy-800 outline-none sm:w-auto"
              />
            </label>
            <label className="px-4 py-3 text-left sm:py-2 sm:px-5">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-navy-600">
                {dict.hero.search.howLong}
              </span>
              <select
                name="hours"
                defaultValue="2"
                className="mt-0.5 w-full bg-transparent text-sm text-navy-800 outline-none sm:w-auto"
              >
                {[1, 2, 3, 4, 6, 8].map((h) => (
                  <option key={h} value={h}>
                    {h} {dict.search.hoursSuffix}
                  </option>
                ))}
              </select>
            </label>
            <div className="px-4 pb-4 sm:px-2 sm:pb-0">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-navy-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-700 sm:w-auto"
              >
                <SearchIcon className="h-4 w-4" />
                {dict.hero.search.button}
              </button>
            </div>
          </form>

          <p className="mt-6 text-xs text-navy-600">
            Live in Amsterdam — book by the hour, pay online, no check-in ceremony.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-navy-900">
          {dict.how.title}
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {dict.how.steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-3xl border border-navy-100 bg-white p-8"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-800 text-sm font-semibold text-gold">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-navy-900">{step.title}</h3>
              <p className="mt-2 text-navy-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured spaces */}
      {featured.length > 0 && (
        <section className="bg-navy-50/60">
          <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-navy-900">
                  {dict.featured.title}
                </h2>
                <p className="mt-2 text-navy-600">{dict.featured.subtitle}</p>
              </div>
              <Link
                href={`/${currentLang}/search`}
                className="inline-flex items-center gap-1 rounded-full border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-800 transition-colors hover:border-navy-400"
              >
                {dict.featured.viewAll}
              </Link>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((space) => (
                <SpaceCard
                  key={space.id}
                  space={space}
                  selected={false}
                  texts={cardTexts}
                  href={`/${currentLang}/spaces/${space.id}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonial */}
      <section className="bg-gold-100/50">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <blockquote className="text-2xl font-medium leading-snug tracking-tight text-navy-800 sm:text-3xl">
            {dict.testimonial.quote}
          </blockquote>
          <p className="mt-6 text-sm font-medium uppercase tracking-widest text-navy-600">
            {dict.testimonial.author}
          </p>
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-navy-900">
          {dict.cities.title}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-center text-navy-600">{dict.cities.subtitle}</p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl bg-gradient-to-br from-navy-800 to-navy-600 p-8 sm:p-10">
            <p className="text-2xl font-semibold text-white">Amsterdam</p>
            <p className="mt-2 inline-block rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-navy-900">
              {dict.cities.cities[0].note}
            </p>
          </div>
          <div className="rounded-3xl border-2 border-dashed border-navy-100 bg-navy-50 p-8 sm:p-10">
            <p className="text-2xl font-semibold text-navy-800">{dict.cities.cities[1].name}</p>
            <p className="mt-2 text-sm font-medium text-navy-600">{dict.cities.cities[1].note}</p>
          </div>
        </div>
      </section>

      {/* Host CTA */}
      <section id="host" className="scroll-mt-20 bg-navy-900">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {dict.hostCta.title}
          </h2>
          <p className="mt-4 max-w-xl text-lg text-navy-100">{dict.hostCta.text}</p>
          <a
            href="mailto:hello@kicknap.com"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-gold px-8 py-4 text-base font-semibold text-navy-900 transition-colors hover:bg-gold-100"
          >
            {dict.hostCta.cta}
          </a>
        </div>
      </section>
    </>
  );
}