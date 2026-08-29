"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { formatEuro } from "@/lib/format";
import { allInHourlyCents } from "@/lib/price";

interface SavedSpace {
  id: number;
  name: string;
  neighborhood: string;
  city: string;
  hourlyPriceCents: number;
  minHours: number;
  photoUrl?: string | null;
}

export interface SavedTexts {
  title: string;
  subtitle: string;
  empty: string;
  emptyText: string;
  browse: string;
  remove: string;
  clearAll: string;
  viewBook: string;
  unavailable: string;
  perHour: string;
}

export function SavedView({ lang, texts }: { lang: string; texts: SavedTexts }) {
  const { items, remove, clear } = useCart();
  const [spaces, setSpaces] = useState<Record<number, SavedSpace | null>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const entries = await Promise.all(
        items.map(async (id): Promise<[number, SavedSpace | null]> => {
          try {
            const res = await fetch(`/api/spaces/${id}`, { cache: "no-store" });
            if (!res.ok) return [id, null];
            const data = (await res.json()) as { space?: SavedSpace };
            return [id, data.space ?? null];
          } catch {
            return [id, null];
          }
        })
      );
      if (cancelled) return;
      const next: Record<number, SavedSpace | null> = {};
      for (const [id, space] of entries) next[id] = space;
      setSpaces(next);
      setLoaded(true);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [items]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">{texts.title}</h1>
      <p className="mt-2 text-navy-600">{texts.subtitle}</p>

      <div className="mt-8 space-y-4">
        {!loaded ? (
          <div className="rounded-3xl border border-navy-100 bg-navy-50/60 p-10 text-center text-navy-600">
            {texts.empty}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-navy-100 bg-navy-50/60 p-10 text-center">
            <h2 className="text-lg font-semibold text-navy-900">{texts.empty}</h2>
            <p className="mt-2 text-navy-600">{texts.emptyText}</p>
            <Link
              href={`/${lang}/search`}
              className="mt-6 inline-block rounded-full bg-navy-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
            >
              {texts.browse}
            </Link>
          </div>
        ) : (
          <>
            {items.length > 1 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clear}
                  className="text-sm font-medium text-navy-600 transition-colors hover:text-rose-600"
                >
                  {texts.clearAll}
                </button>
              </div>
            )}
            {items.map((id) => {
              const space = spaces[id];
              return (
                <div
                  key={id}
                  className="flex items-center gap-4 rounded-3xl border border-navy-100 bg-white p-4"
                >
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl bg-navy-100">
                    {space?.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={space.photoUrl}
                        alt={space.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {space ? (
                      <>
                        <p className="truncate font-semibold text-navy-900">{space.name}</p>
                        <p className="mt-0.5 text-sm text-navy-600">
                          {space.neighborhood} · {space.city} · {space.minHours}h
                        </p>
                        <p className="mt-1 text-sm font-semibold text-navy-900">
                          {formatEuro(allInHourlyCents(space.hourlyPriceCents))}
                          <span className="font-medium text-navy-600">{texts.perHour}</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-navy-900">{texts.unavailable}</p>
                        <p className="mt-0.5 text-sm text-navy-600">#{id}</p>
                      </>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {space && (
                      <Link
                        href={`/${lang}/spaces/${space.id}`}
                        className="rounded-full bg-navy-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-navy-700"
                      >
                        {texts.viewBook}
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(id)}
                      className="text-xs font-medium text-navy-600 transition-colors hover:text-rose-600"
                    >
                      {texts.remove}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}