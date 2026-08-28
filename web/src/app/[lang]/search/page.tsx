import Link from "next/link";
import { lang } from "next/root-params";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { SearchView } from "@/components/search-view";
import { serviceBaseUrl } from "@/lib/api";
import { amsTimeLabel, amsZonedIso, localDateString } from "@/lib/format";
import type { SpacesResponse } from "@/lib/types/space";

const AREAS = ["centrum", "oost", "west", "zuid", "noord", "schiphol"] as const;
const MAX_OPTIONS = [10, 15, 20] as const;
const SORTS = ["priceAsc", "priceDesc", "rating"] as const;
const HOURS_OPTIONS = [1, 2, 3, 4, 6, 8] as const;

type SearchState = { area?: string; max?: string; sort?: string; date?: string; time?: string; hours?: string };

function parseSearchParams(raw: SearchState): SearchState {
  const parsed: SearchState = {};
  if (raw.area && (AREAS as readonly string[]).includes(raw.area)) parsed.area = raw.area;
  if (raw.max && (MAX_OPTIONS as readonly number[]).includes(Number(raw.max))) parsed.max = raw.max;
  if (raw.sort && (SORTS as readonly string[]).includes(raw.sort)) parsed.sort = raw.sort;
  if (raw.date && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)) parsed.date = raw.date;
  if (raw.time && /^\d{2}:\d{2}$/.test(raw.time)) parsed.time = raw.time;
  if (raw.hours && (HOURS_OPTIONS as readonly number[]).includes(Number(raw.hours))) {
    parsed.hours = raw.hours;
  }
  return parsed;
}

function makeHref(currentLang: string, state: SearchState, override: SearchState): string {
  const merged = { ...state, ...override };
  const query = new URLSearchParams();
  if (merged.area) query.set("area", merged.area);
  if (merged.max) query.set("max", merged.max);
  if (merged.sort) query.set("sort", merged.sort);
  if (merged.date) query.set("date", merged.date);
  if (merged.time) query.set("time", merged.time);
  if (merged.hours) query.set("hours", merged.hours);
  const qs = query.toString();
  return `/${currentLang}/search${qs ? `?${qs}` : ""}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchState>;
}) {
  const currentLang = await lang();
  const dict = await getDictionary();
  const state = parseSearchParams(await searchParams);

  const href = (override: SearchState) => makeHref(currentLang, state, override);

  let spaces: SpacesResponse["spaces"] | null = null;
  let serviceError = false;
  let timeFilter: { from: string; to: string; hours: number } | null = null;

  const listingsUrl = serviceBaseUrl("listings");
  const query = new URLSearchParams();
  if (state.area) query.set("area", state.area);
  if (state.max) query.set("max", state.max);
  if (state.sort) query.set("sort", state.sort);
  const qs = query.toString();

  try {
    const res = await fetch(`${listingsUrl}/api/v1/spaces${qs ? `?${qs}` : ""}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as SpacesResponse;
      spaces = data.spaces;
    } else {
      serviceError = true;
    }
  } catch {
    serviceError = true;
  }

  let availabilityNote: string | null = null;
  let timeEmptied = false;
  if (spaces && state.date && state.time && state.hours) {
    const hours = Number(state.hours);
    const fromIso = amsZonedIso(state.date, state.time);
    const toIso = new Date(Date.parse(fromIso) + hours * 3600_000).toISOString();
    timeFilter = { from: fromIso, to: toIso, hours };
    try {
      const res = await fetch(
        `${serviceBaseUrl("availability")}/api/v1/check-many?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = (await res.json()) as {
          available: number;
          total: number;
          results: { spaceId: number; available: boolean }[];
        };
        const availableIds = new Set(
          data.results.filter((r) => r.available).map((r) => r.spaceId)
        );
        const total = spaces.length;
        spaces = spaces.filter((s) => availableIds.has(s.id));
        timeEmptied = data.available === 0 && total > 0;
        if (!timeEmptied && spaces.length < total) {
          const toLabel = amsTimeLabel(toIso);
          availabilityNote = `${spaces.length} ${dict.search.availOf} ${total} ${dict.search.availFreeAt} ${state.date} ${state.time}\u2013${toLabel} (${hours}${dict.search.hoursSuffix})`;
        }
      }
    } catch {
      // availability check failed — show unfiltered results
    }
  }

  const texts = {
    perHour: dict.search.perHour,
    minHours: dict.search.minHours,
    demoNote: dict.search.demoNote,
    map: dict.search.map,
    list: dict.search.list,
  };

  const pillLink = (url: string, label: string, active: boolean) => (
    <Link
      href={url}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-navy-800 bg-navy-800 text-white"
          : "border-navy-100 bg-white text-navy-600 hover:border-navy-300"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">
        {dict.search.title}
      </h1>
      <p className="mt-2 text-navy-600">{dict.search.subtitle}</p>

      {/* Filters */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-40 text-sm font-semibold text-navy-800">{dict.search.area}</span>
          {(["all", ...AREAS] as const).map((area) =>
            pillLink(
              href({ area: area === "all" ? undefined : area }),
              dict.search.neighborhoods[area as keyof typeof dict.search.neighborhoods],
              state.area === area || (area === "all" && !state.area)
            )
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="w-40 text-sm font-semibold text-navy-800">{dict.search.maxPrice}</span>
          {pillLink(
            href({ max: undefined }),
            dict.search.anyPrice,
            !state.max
          )}
          {MAX_OPTIONS.map((value) =>
            pillLink(
              href({ max: String(value) }),
              dict.search[`price${value}` as keyof typeof dict.search] as string,
              state.max === String(value)
            )
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="w-40 text-sm font-semibold text-navy-800">{dict.search.sort}</span>
          {SORTS.map((sort) => {
            const label =
              sort === "priceAsc"
                ? dict.search.sortPriceAsc
                : sort === "priceDesc"
                  ? dict.search.sortPriceDesc
                  : dict.search.sortRating;
            return pillLink(
              href({ sort: sort === "priceAsc" ? undefined : sort }),
              label,
              (!state.sort && sort === "priceAsc") || state.sort === sort
            );
          })}
        </div>
      </div>

      {/* Time availability filter */}
      <form
        method="get"
        action={`/${currentLang}/search`}
        className="mt-8 flex flex-wrap items-end gap-4 rounded-3xl border border-navy-100 bg-white p-5"
      >
        <input type="hidden" name="area" value={state.area ?? ""} />
        <input type="hidden" name="max" value={state.max ?? ""} />
        <input type="hidden" name="sort" value={state.sort ?? ""} />
        <div>
          <label htmlFor="f-date" className="block text-xs font-semibold uppercase tracking-wide text-navy-600">
            {dict.search.date}
          </label>
          <input
            id="f-date"
            type="date"
            name="date"
            defaultValue={state.date}
            min={localDateString(new Date())}
            className="mt-1 rounded-xl border border-navy-200 bg-navy-50 px-3 py-2 text-sm text-navy-900 outline-none focus:border-navy-400"
          />
        </div>
        <div>
          <label htmlFor="f-time" className="block text-xs font-semibold uppercase tracking-wide text-navy-600">
            {dict.search.timeFrom}
          </label>
          <input
            id="f-time"
            type="time"
            name="time"
            defaultValue={state.time}
            step={900}
            className="mt-1 rounded-xl border border-navy-200 bg-navy-50 px-3 py-2 text-sm text-navy-900 outline-none focus:border-navy-400"
          />
        </div>
        <div>
          <label htmlFor="f-hours" className="block text-xs font-semibold uppercase tracking-wide text-navy-600">
            {dict.search.duration}
          </label>
          <select
            id="f-hours"
            name="hours"
            defaultValue={state.hours ?? "2"}
            className="mt-1 rounded-xl border border-navy-200 bg-navy-50 px-3 py-2 text-sm text-navy-900 outline-none focus:border-navy-400"
          >
            {HOURS_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h} {dict.search.hoursSuffix}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-full bg-navy-800 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
        >
          {dict.search.applyFilters}
        </button>
      </form>

      {/* Results */}
      <div className="mt-10">
        {availabilityNote && (
          <p className="mb-6 rounded-2xl border border-gold-200 bg-gold-100/50 px-4 py-3 text-sm font-medium text-navy-800">
            {availabilityNote}
          </p>
        )}
        {serviceError ? (
          <div className="rounded-3xl border border-navy-100 bg-navy-50/60 p-10 text-center">
            <p className="text-navy-700">{dict.search.searchDown}</p>
          </div>
        ) : spaces !== null && spaces.length === 0 ? (
          <div className="rounded-3xl border border-navy-100 bg-navy-50/60 p-10 text-center">
            <h2 className="text-lg font-semibold text-navy-900">
              {timeEmptied ? dict.search.availEmptyTitle : dict.search.emptyTitle}
            </h2>
            <p className="mt-2 text-navy-600">
              {timeEmptied ? dict.search.availEmptyText : dict.search.emptyText}
            </p>
            <Link
              href={href({ area: undefined, max: undefined, sort: undefined, date: undefined, time: undefined, hours: undefined })}
              className="mt-6 inline-block rounded-full bg-navy-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
            >
              {dict.search.clearFilters}
            </Link>
          </div>
        ) : spaces !== null ? (
          <>
            <p className="mb-6 text-sm text-navy-600">
              <span className="font-semibold text-navy-900">{spaces.length}</span>{" "}
              {dict.search.results}
            </p>
            <SearchView spaces={spaces} texts={texts} lang={currentLang} />
          </>
        ) : null}
      </div>
    </div>
  );
}