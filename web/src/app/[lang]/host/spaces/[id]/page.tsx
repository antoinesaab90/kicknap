import Link from "next/link";
import { lang } from "next/root-params";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireHost } from "@/lib/host";
import { serviceBaseUrl } from "@/lib/api";
import { SpaceForm } from "@/components/space-form";
import type { HostSpaceDto, HostSpacesResponse, HoursResponse, OpeningRuleDto } from "@/lib/types/host";

export default async function EditSpacePage({ params }: { params: Promise<{ id: string }> }) {
  const currentLang = await lang();
  const dict = await getDictionary();
  const host = await requireHost();
  const { id } = await params;
  const spaceId = Number(id);

  if (!host) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-navy-900 sm:text-3xl">
          {dict.host.loginTitle}
        </h1>
        <Link
          href={`/${currentLang}/login?next=/${currentLang}/host`}
          className="mt-8 inline-block rounded-full bg-navy-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
        >
          {dict.nav.login}
        </Link>
      </div>
    );
  }

  if (!Number.isInteger(spaceId)) {
    return <div className="py-24 text-center text-navy-600">{dict.space.notFoundText}</div>;
  }

  let owned: HostSpaceDto | null = null;
  let rules: OpeningRuleDto[] = [];
  try {
    const [listRes, hoursRes] = await Promise.all([
      fetch(`${serviceBaseUrl("listings")}/api/v1/spaces?host=${encodeURIComponent(host.email)}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${serviceBaseUrl("availability")}/api/v1/spaces/${spaceId}/hours`, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      }),
    ]);
    if (listRes.ok) {
      const list = (await listRes.json()) as HostSpacesResponse;
      owned = list.spaces.find((s) => s.id === spaceId) ?? null;
    }
    if (hoursRes.ok) {
      const hours = (await hoursRes.json()) as HoursResponse;
      rules = hours.rules;
    }
  } catch {
    owned = null;
  }

  if (!owned) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-navy-900">
          {dict.space.notFoundTitle}
        </h1>
        <p className="mt-3 text-navy-600">{dict.space.notFoundText}</p>
        <Link
          href={`/${currentLang}/host`}
          className="mt-8 inline-block rounded-full bg-navy-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
        >
          {dict.host.back}
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
        {dict.host.editTitle}
      </h1>
      <p className="mt-2 text-navy-600">{owned.name}</p>

      <div className="mt-8">
        <SpaceForm
          mode="edit"
          lang={currentLang}
          dict={dict}
          spaceId={spaceId}
          initial={owned}
          initialRules={rules}
        />
      </div>
    </div>
  );
}