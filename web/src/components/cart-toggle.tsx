"use client";

import { useCart } from "@/components/cart-context";

function BookmarkIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function CartToggle({
  spaceId,
  texts,
}: {
  spaceId: number;
  texts: { save: string; saved: string };
}) {
  const { has, toggle } = useCart();
  const saved = has(spaceId);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? texts.saved : texts.save}
      title={saved ? texts.saved : texts.save}
      onClick={() => toggle(spaceId)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        saved
          ? "border-gold-600 bg-gold-600 text-white"
          : "border-navy-200 bg-white text-navy-600 hover:border-navy-400 hover:text-navy-800"
      }`}
    >
      {saved ? <CheckIcon /> : <BookmarkIcon />}
      <span>{saved ? texts.saved : texts.save}</span>
    </button>
  );
}