import Link from "next/link";
import { lang } from "next/root-params";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireHost } from "@/lib/host";
import { SpaceForm } from "@/components/space-form";

export default async function NewSpacePage() {
  const currentLang = await lang();
  const dict = await getDictionary();
  const host = await requireHost();

  if (!host) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-navy-900 sm:text-3xl">
          {dict.host.loginTitle}
        </h1>
        <p className="mt-3 text-navy-600">{dict.host.loginText}</p>
        <Link
          href={`/${currentLang}/login?next=/${currentLang}/host/new`}
          className="mt-8 inline-block rounded-full bg-navy-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
        >
          {dict.nav.login}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <Link
        href={`/${currentLang}/host`}
        className="inline-block text-sm font-medium text-navy-600 transition-colors hover:text-navy-900"
      >
        ← {dict.host.back}
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy-900">
        {dict.host.newTitle}
      </h1>
      <p className="mt-2 text-navy-600">{dict.host.subtitle}</p>

      <div className="mt-8">
        <SpaceForm mode="new" lang={currentLang} dict={dict} />
      </div>
    </div>
  );
}