"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AREA_COORDS, AREAS, type HostSpaceDto, type OpeningRuleDto } from "@/lib/types/host";
import { minutesToTime, timeToMinutes } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface SpaceFormProps {
  mode: "new" | "edit";
  lang: string;
  dict: Dictionary;
  spaceId?: number;
  initial?: HostSpaceDto;
  initialRules?: OpeningRuleDto[];
}

const DEFAULT_RULES = (): OpeningRuleDto[] =>
  [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    startMinute: 8 * 60,
    endMinute: 20 * 60,
  }));

export function SpaceForm({ mode, lang, dict, spaceId, initial, initialRules }: SpaceFormProps) {
  const router = useRouter();
  const t = dict.host;

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [neighborhood, setNeighborhood] = useState(initial?.neighborhood ?? "centrum");
  const [city, setCity] = useState(initial?.city ?? "Amsterdam");
  const [lat, setLat] = useState(initial?.lat ?? AREA_COORDS.centrum.lat);
  const [lng, setLng] = useState(initial?.lng ?? AREA_COORDS.centrum.lng);
  const [euros, setEuros] = useState(
    initial ? (initial.hourlyPriceCents / 100).toFixed(0) : "10"
  );
  const [minHours, setMinHours] = useState(String(initial?.minHours ?? 1));
  const [maxHours, setMaxHours] = useState(String(initial?.maxHours ?? 8));
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [rules, setRules] = useState<OpeningRuleDto[]>(initialRules ?? DEFAULT_RULES());
  const [closedDays, setClosedDays] = useState<Record<number, boolean>>(() => {
    if (!initialRules) return {};
    const closed: Record<number, boolean> = {};
    for (let day = 0; day <= 6; day++) {
      closed[day] = !initialRules.some((r) => r.dayOfWeek === day);
    }
    return closed;
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(initial?.published ?? false);

  const setDayTime = useCallback((day: number, key: "startMinute" | "endMinute", value: string) => {
    const minutes = timeToMinutes(value);
    if (minutes === null) return;
    setRules((prev) => {
      const next = prev.map((r) => (r.dayOfWeek === day ? { ...r, [key]: minutes } : r));
      if (!next.some((r) => r.dayOfWeek === day)) {
        next.push({ dayOfWeek: day, startMinute: 480, endMinute: 1200 });
      }
      return next;
    });
  }, []);

  function toggleClosed(day: number) {
    setClosedDays((prev) => {
      const next = { ...prev, [day]: !prev[day] };
      return next;
    });
  }

  const handleNeighborhood = useCallback((value: string) => {
    setNeighborhood(value);
    const coords = AREA_COORDS[value];
    if (coords) {
      setLat(coords.lat);
      setLng(coords.lng);
    }
  }, []);

  const buildRules = (): OpeningRuleDto[] =>
    [0, 1, 2, 3, 4, 5, 6]
      .filter((day) => !closedDays[day])
      .map((day) => {
        const existing = rules.find((r) => r.dayOfWeek === day);
        return existing ?? { dayOfWeek: day, startMinute: 480, endMinute: 1200 };
      });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const space = {
      name,
      description: description || null,
      address: address || null,
      neighborhood,
      city,
      lat,
      lng,
      hourlyPriceCents: Math.max(1, Math.round(Number(euros) * 100)),
      minHours: Math.max(1, Number(minHours) || 1),
      maxHours: Math.max(1, Number(maxHours) || 8),
      photoUrl: photoUrl || null,
    };

    try {
      const url =
        mode === "new"
          ? "/api/host/spaces"
          : `/api/host/spaces/${spaceId}`;
      const method = mode === "new" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ space, rules: buildRules() }),
      });
      if (res.status === 401) {
        router.push(`/${lang}/login?next=/${lang}/host`);
        return;
      }
      if (!res.ok) {
        setError(t.failed);
        return;
      }
      const data = (await res.json()) as { space?: { id: number } };
      if (mode === "new" && data.space) {
        router.push(`/${lang}/host/spaces/${data.space.id}`);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError(t.failed);
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    if (!spaceId) return;
    setError(null);
    const next = !published;
    try {
      const res = await fetch(`/api/host/spaces/${spaceId}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ published: next }),
      });
      if (res.ok) {
        setPublished(next);
      } else {
        setError(t.failed);
      }
    } catch {
      setError(t.failed);
    }
  }

  const input =
    "w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-navy-900 outline-none transition-colors focus:border-navy-500";
  const label = "mb-1.5 block text-sm font-medium text-navy-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5">
        <div>
          <label htmlFor="name" className={label}>
            {t.name} *
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={input}
            placeholder="Cozy canal-side studio"
          />
        </div>

        <div>
          <label htmlFor="description" className={label}>
            {t.description}
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={input}
            placeholder="A quiet studio with blackout curtains, a bed and fast wifi. 10 min from Centraal."
          />
        </div>

        <div>
          <label htmlFor="address" className={label}>
            {t.address}
          </label>
          <input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={input}
            placeholder="Keizersgracht 123"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="neighborhood" className={label}>
              {t.neighborhood} *
            </label>
            <select
              id="neighborhood"
              value={neighborhood}
              onChange={(e) => handleNeighborhood(e.target.value)}
              className={input}
            >
              {AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="city" className={label}>
              {t.city} *
            </label>
            <input
              id="city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={input}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="lat" className={label}>
              Lat
            </label>
            <input
              id="lat"
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(Number(e.target.value))}
              className={input}
            />
          </div>
          <div>
            <label htmlFor="lng" className={label}>
              Lng
            </label>
            <input
              id="lng"
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(Number(e.target.value))}
              className={input}
            />
          </div>
        </div>

        <div>
          <label htmlFor="hourlyPrice" className={label}>
            {t.hourlyPrice} *
          </label>
          <input
            id="hourlyPrice"
            required
            type="number"
            min="1"
            step="1"
            value={euros}
            onChange={(e) => setEuros(e.target.value)}
            className={input}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="minHours" className={label}>
              {t.minHours}
            </label>
            <input
              id="minHours"
              type="number"
              min="1"
              value={minHours}
              onChange={(e) => setMinHours(e.target.value)}
              className={input}
            />
          </div>
          <div>
            <label htmlFor="maxHours" className={label}>
              {t.maxHours}
            </label>
            <input
              id="maxHours"
              type="number"
              min="1"
              value={maxHours}
              onChange={(e) => setMaxHours(e.target.value)}
              className={input}
            />
          </div>
        </div>

        <div>
          <label htmlFor="photoUrl" className={label}>
            {t.photoUrl}
          </label>
          <input
            id="photoUrl"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            className={input}
            placeholder="https://…/photo.jpg"
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-navy-900">{t.hours}</h2>
        <div className="mt-3 overflow-hidden rounded-3xl border border-navy-200">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => {
            const closed = Boolean(closedDays[day]);
            const rule = rules.find((r) => r.dayOfWeek === day);
            return (
              <div
                key={day}
                className={`flex flex-wrap items-center gap-3 border-b border-navy-100 px-4 py-3 last:border-b-0 sm:flex-nowrap ${
                  closed ? "bg-navy-50/50" : ""
                }`}
              >
                <span className="w-12 text-sm font-semibold text-navy-900">
                  {t.days[day]}
                </span>
                <label className="flex items-center gap-2 text-sm text-navy-700">
                  <input
                    type="checkbox"
                    checked={closed}
                    onChange={() => toggleClosed(day)}
                    className="h-4 w-4 accent-navy-800"
                  />
                  {t.closed}
                </label>
                {!closed && (
                  <div className="ml-auto flex items-center gap-2 text-sm">
                    <span className="text-navy-500">{t.open}</span>
                    <input
                      type="time"
                      value={minutesToTime(rule?.startMinute ?? 480)}
                      onChange={(e) => setDayTime(day, "startMinute", e.target.value)}
                      className="rounded-xl border border-navy-200 px-2 py-1.5 outline-none focus:border-navy-500"
                    />
                    <span className="text-navy-500">{t.close}</span>
                    <input
                      type="time"
                      value={minutesToTime(rule?.endMinute ?? 1200)}
                      onChange={(e) => setDayTime(day, "endMinute", e.target.value)}
                      className="rounded-xl border border-navy-200 px-2 py-1.5 outline-none focus:border-navy-500"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm font-medium text-rose-700">{error}</p>}
      {saved && <p className="text-sm font-medium text-emerald-700">{t.saved}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-navy-800 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-50"
        >
          {saving ? t.saving : t.save}
        </button>
        {mode === "edit" && spaceId && (
          <button
            type="button"
            onClick={togglePublish}
            className="rounded-full border border-navy-200 px-8 py-3 text-sm font-semibold text-navy-700 transition-colors hover:border-navy-400"
          >
            {published ? t.unpublish : t.publish}
          </button>
        )}
        <LinkBack lang={lang} dict={dict} />
      </div>
    </form>
  );
}

function LinkBack({ lang, dict }: { lang: string; dict: Dictionary }) {
  return (
    <a
      href={`/${lang}/host`}
      className="text-sm font-medium text-navy-600 underline-offset-2 hover:underline"
    >
      {dict.host.back}
    </a>
  );
}