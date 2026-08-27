"use client";

import { useState } from "react";
import { MapView } from "@/components/map-view";
import { SpaceCard } from "@/components/space-card";
import type { SpaceDto } from "@/lib/types/space";

export function SearchView({
  spaces,
  texts,
}: {
  spaces: SpaceDto[];
  texts: { perHour: string; minHours: string; demoNote: string; map: string; list: string };
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [view, setView] = useState<"list" | "map">(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "map" : "list"
  );

  function handleSelect(id: number) {
    setSelectedId(id);
    if (typeof document !== "undefined") {
      document
        .querySelector(`[data-space-id="${id}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between sm:hidden">
        <span className="text-sm text-navy-600">
          {spaces.length} · {view === "map" ? texts.map : texts.list}
        </span>
        <div className="flex rounded-full bg-navy-50 p-1">
          {(["list", "map"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                view === key ? "bg-white text-navy-900 shadow" : "text-navy-600"
              }`}
            >
              {key === "list" ? texts.list : texts.map}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`space-y-4 ${view === "map" ? "hidden" : ""} lg:block`}>
          {spaces.map((space) => (
            <SpaceCard
              key={space.id}
              space={space}
              selected={space.id === selectedId}
              texts={texts}
              onSelect={() => handleSelect(space.id)}
            />
          ))}
        </div>

        <div
          className={`h-[420px] overflow-hidden rounded-3xl border border-navy-100 lg:sticky lg:top-20 lg:h-[calc(100vh-120px)] ${
            view === "list" ? "hidden" : ""
          } lg:block`}
        >
          <MapView spaces={spaces} selectedId={selectedId} onSelect={handleSelect} />
        </div>
      </div>
    </>
  );
}