import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function Header({ lang, dict }: { lang: string; dict: Dictionary }) {
  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href={`/${lang}`}
          className="text-[22px] font-semibold tracking-tight text-navy-800"
          aria-label="kicknap"
        >
          kick<span className="text-gold-600">nap</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href={`/${lang}/search`}
            className="text-sm font-medium text-navy-600 transition-colors hover:text-navy-800"
          >
            {dict.nav.spaces}
          </Link>
          <Link
            href={`/${lang}#how-it-works`}
            className="text-sm font-medium text-navy-600 transition-colors hover:text-navy-800"
          >
            {dict.nav.howItWorks}
          </Link>
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <LanguageSwitcher lang={lang} />
          <Link
            href={`/${lang}#host`}
            className="hidden rounded-full bg-navy-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 sm:inline-block"
          >
            {dict.nav.listYourSpace}
          </Link>
        </div>
      </div>
    </header>
  );
}