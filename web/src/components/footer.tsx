import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function Footer({ lang, dict }: { lang: string; dict: Dictionary }) {
  return (
    <footer id="footer" className="mt-24 border-t border-navy-100 bg-navy-50/60">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="text-xl font-semibold tracking-tight text-navy-800">
              kick<span className="text-gold-600">nap</span>
            </p>
            <p className="mt-8 text-xs text-navy-600">
              Learnix &middot; KvK 42119992 &middot; Amsterdam, Netherlands
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-navy-800">{dict.footer.product}</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href={`/${lang}/search`}
                  className="text-sm text-navy-600 transition-colors hover:text-navy-800"
                >
                  {dict.nav.spaces}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}#how-it-works`}
                  className="text-sm text-navy-600 transition-colors hover:text-navy-800"
                >
                  {dict.nav.howItWorks}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}#host`}
                  className="text-sm text-navy-600 transition-colors hover:text-navy-800"
                >
                  {dict.nav.listYourSpace}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-navy-800">{dict.footer.support}</h4>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-sm text-navy-600 transition-colors hover:text-navy-800">
                  {dict.footer.helpCenter}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-navy-600 transition-colors hover:text-navy-800">
                  {dict.footer.safety}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-navy-600 transition-colors hover:text-navy-800">
                  {dict.footer.contact}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-navy-100 pt-6 sm:flex-row">
          <div className="flex items-center gap-4 text-xs text-navy-600">
            <p>{dict.footer.legal}</p>
            <span className="text-navy-300">·</span>
            <Link
              href={`/${lang}/legal/terms`}
              className="transition-colors hover:text-navy-900"
            >
              {dict.footer.terms}
            </Link>
            <Link
              href={`/${lang}/legal/privacy`}
              className="transition-colors hover:text-navy-900"
            >
              {dict.footer.privacy}
            </Link>
          </div>
          <LanguageSwitcher lang={lang} />
        </div>
      </div>
    </footer>
  );
}