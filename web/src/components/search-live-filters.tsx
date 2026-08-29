"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export interface SearchLiveFilterTexts {
  guests: string;
  anyGuests: string;
  adults: string;
  kids: string;
  pets: string;
  flexibility: string;
  noFlex: string;
  flex1: string;
  flex2: string;
  flex4: string;
}

interface SearchLiveFiltersProps {
  lang: string;
  area: string;
  max: string;
  sort: string;
  date: string;
  time: string;
  hours: string;
  adults: string;
  kids: string;
  pets: string;
  flex: string;
  texts: SearchLiveFilterTexts;
}

function buildHref(
  props: SearchLiveFiltersProps,
  override: { adults?: string; kids?: string; pets?: string; flex?: string }
): string {
  const merged = { ...props, ...override };
  const query = new URLSearchParams();
  if (merged.area) query.set("area", merged.area);
  if (merged.max) query.set("max", merged.max);
  if (merged.sort) query.set("sort", merged.sort);
  if (merged.date) query.set("date", merged.date);
  if (merged.time) query.set("time", merged.time);
  if (merged.hours && merged.hours !== "2") query.set("hours", merged.hours);
  if (merged.adults && merged.adults !== "1") query.set("adults", merged.adults);
  if (merged.kids && merged.kids !== "0") query.set("children", merged.kids);
  if (merged.pets && merged.pets !== "0") query.set("pets", merged.pets);
  if (merged.flex && merged.flex !== "0") query.set("flex", merged.flex);
  const qs = query.toString();
  return `/${merged.lang}/search${qs ? `?${qs}` : ""}`;
}

export function SearchLiveFilters(props: SearchLiveFiltersProps) {
  const router = useRouter();
  const { texts } = props;

  const adults = Number(props.adults);
  const kids = Number(props.kids);
  const pets = Number(props.pets);
  const flex = Number(props.flex);

  const setGuests = useCallback(
    (nextAdults: number, nextKids: number, nextPets: number) => {
      const href = buildHref(props, {
        adults: nextAdults > 1 ? String(nextAdults) : "1",
        kids: nextKids > 0 ? String(nextKids) : "0",
        pets: nextPets > 0 ? String(nextPets) : "0",
      });
      router.replace(href, { scroll: false });
    },
    [props, router]
  );

  const setFlex = useCallback(
    (nextFlex: number) => {
      const href = buildHref(props, { flex: nextFlex > 0 ? String(nextFlex) : "0" });
      router.replace(href, { scroll: false });
    },
    [props, router]
  );

  const isDefaultGuests = adults === 1 && kids === 0 && pets === 0;

  const flexOptions = [
    { label: texts.noFlex, v: 0 },
    { label: texts.flex1, v: 1 },
    { label: texts.flex2, v: 2 },
    { label: texts.flex4, v: 4 },
  ];

  const pill = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
      active
        ? "border-navy-800 bg-navy-800 text-white"
        : "border-navy-100 bg-white text-navy-600 hover:border-navy-300"
    }`;

  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-3xl border border-navy-100 bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-40 text-sm font-semibold text-navy-800">{texts.guests}</span>
        <span className="flex items-center gap-4">
          <Stepper
            label={texts.adults}
            value={adults}
            min={1}
            max={20}
            defaultValue={1}
            onChange={(v) => setGuests(v, kids, pets)}
          />
          <Stepper
            label={texts.kids}
            value={kids}
            min={0}
            max={20}
            defaultValue={0}
            onChange={(v) => setGuests(adults, v, pets)}
          />
          <Stepper
            label={texts.pets}
            value={pets}
            min={0}
            max={20}
            defaultValue={0}
            onChange={(v) => setGuests(adults, kids, v)}
          />
          {isDefaultGuests && (
            <span className="ml-2 whitespace-nowrap text-xs font-medium text-navy-400">
              {texts.anyGuests}
            </span>
          )}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="w-40 text-sm font-semibold text-navy-800">{texts.flexibility}</span>
        {flexOptions.map((opt) => (
          <button
            key={opt.v}
            type="button"
            onClick={() => setFlex(opt.v)}
            className={pill(flex === opt.v)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  defaultValue,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  defaultValue: number;
  onChange: (next: number) => void;
}) {
  return (
    <span className="flex items-center gap-2">
      <span className="text-sm text-navy-700">{label}</span>
      <span className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`${label} -`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-navy-200 text-navy-800 transition-colors hover:border-navy-400 disabled:opacity-40"
        >
          {"\u2212"}
        </button>
        <span
          className={`w-6 text-center text-sm font-semibold ${
            value === defaultValue ? "text-navy-300" : "text-navy-900"
          }`}
        >
          {value}
        </span>
        <button
          type="button"
          aria-label={`${label} +`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-navy-200 text-navy-800 transition-colors hover:border-navy-400 disabled:opacity-40"
        >
          +
        </button>
      </span>
    </span>
  );
}