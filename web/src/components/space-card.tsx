import type { SpaceDto } from "@/lib/types/space";

export function formatEuro(cents: number): string {
  const value = cents / 100;
  return `€${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

export function SpaceCard({
  space,
  selected,
  texts,
  onSelect,
}: {
  space: SpaceDto;
  selected: boolean;
  texts: { perHour: string; minHours: string; demoNote: string };
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      data-space-id={space.id}
      onClick={onSelect}
      className={`w-full rounded-3xl border bg-white p-3 text-left transition-all ${
        selected
          ? "border-gold-600 ring-2 ring-gold-600/40"
          : "border-navy-100 hover:border-navy-300"
      }`}
    >
      <div className="relative h-52 overflow-hidden rounded-2xl bg-navy-100">
        {space.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={space.photoUrl}
            alt={space.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {space.isDemo && (
          <span className="absolute left-3 top-3 rounded-full bg-navy-800/85 px-3 py-1 text-xs font-semibold text-white">
            {texts.demoNote}
          </span>
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-navy-900 shadow">
          {formatEuro(space.hourlyPriceCents)}
          <span className="font-medium text-navy-600">{texts.perHour}</span>
        </span>
        {space.timesRated > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-navy-800 shadow">
            ★ {space.rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="px-1 pb-1 pt-3">
        <p className="font-semibold text-navy-900">{space.name}</p>
        <div className="mt-1 flex items-center justify-between text-sm text-navy-600">
          <span>
            {space.neighborhood} · {space.city}
          </span>
          <span className="font-medium">
            {space.minHours}h {texts.minHours}
          </span>
        </div>
      </div>
    </button>
  );
}