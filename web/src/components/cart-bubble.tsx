"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-context";

export function SavedBubble({ lang }: { lang: string }) {
  const { count } = useCart();
  const router = useRouter();

  function openSaved() {
    router.push(`/${lang}/cart`);
  }

  return (
    <button
      type="button"
      onClick={openSaved}
      aria-label="Saved spaces"
      className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg ring-1 transition-transform hover:scale-105 ${
        count > 0
          ? "bg-navy-900 text-white ring-navy-800"
          : "bg-navy-100 text-navy-500 ring-navy-100"
      }`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={count > 0 ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-gold-600 px-1.5 text-xs font-bold text-white ring-2 ring-white">
          {count}
        </span>
      )}
    </button>
  );
}