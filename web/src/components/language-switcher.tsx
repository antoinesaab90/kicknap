"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { locales, localeLabels } from "@/lib/i18n/config";

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  );
}

export function LanguageSwitcher({ lang }: { lang: string }) {
  const pathname = usePathname() ?? `/${lang}`;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const basePath = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/");

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Change language"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-50 hover:text-navy-800"
      >
        <GlobeIcon className="h-5 w-5" />
        <span className="hidden sm:inline">{localeLabels[lang as keyof typeof localeLabels]}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-navy-100 bg-white p-1.5 shadow-xl"
        >
          {locales.map((locale) => (
            <Link
              key={locale}
              href={`/${locale}${basePath}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                locale === lang
                  ? "bg-navy-50 text-navy-800"
                  : "text-navy-600 hover:bg-navy-50 hover:text-navy-800"
              }`}
            >
              <span>{localeLabels[locale]}</span>
              {locale === lang && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-4 w-4 text-gold-600" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}