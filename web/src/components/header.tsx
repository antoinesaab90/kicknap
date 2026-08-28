import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getSession } from "@/lib/auth";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export async function Header({ lang, dict }: { lang: string; dict: Dictionary }) {
  const session = await getSession();
  const signedIn = Boolean(session?.token);

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
          {signedIn && (
            <Link
              href={`/${lang}/bookings`}
              className="text-sm font-medium text-navy-600 transition-colors hover:text-navy-800"
            >
              {dict.nav.myBookings}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <LanguageSwitcher lang={lang} />
          {signedIn ? (
            <>
              {session && (
                <span
                  className="hidden max-w-[10rem] truncate text-xs font-medium text-navy-600 sm:inline-block"
                  title={session.email}
                >
                  {session.email}
                </span>
              )}
              <Link
                href={`/api/auth/logout?next=/${lang}`}
                className="hidden rounded-full border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:border-navy-400 sm:inline-block"
              >
                {dict.nav.signOut}
              </Link>
            </>
          ) : (
            <Link
              href={`/${lang}/login`}
              className="rounded-full border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:border-navy-400"
            >
              {dict.nav.login}
            </Link>
          )}
          <Link
            href={signedIn ? `/${lang}/host` : `/${lang}#host`}
            className="hidden rounded-full bg-navy-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 sm:inline-block"
          >
            {signedIn ? dict.nav.hostDashboard : dict.nav.listYourSpace}
          </Link>
        </div>
      </div>
    </header>
  );
}