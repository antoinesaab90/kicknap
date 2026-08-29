export interface CapacityWords {
  fits: string;
  adult: string;
  adults: string;
  child: string;
  children: string;
  petsAllowed: string;
  petsNot: string;
}

export function capacityLine(
  space: { maxAdults: number; maxChildren: number; petsAllowed: boolean },
  t: CapacityWords
): string {
  const parts = [
    `${space.maxAdults} ${space.maxAdults === 1 ? t.adult : t.adults}`,
  ];
  if (space.maxChildren > 0) {
    parts.push(
      `${space.maxChildren} ${space.maxChildren === 1 ? t.child : t.children}`
    );
  }
  parts.push(space.petsAllowed ? t.petsAllowed : t.petsNot);
  return `${t.fits} ${parts.join(" · ")}`;
}