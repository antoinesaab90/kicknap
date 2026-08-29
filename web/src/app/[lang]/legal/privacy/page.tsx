import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function PrivacyPage() {
  const dict = await getDictionary();
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">
        {dict.legal.privacyTitle}
      </h1>
      <p className="mt-2 text-sm text-navy-500">{dict.legal.privacyUpdated}</p>
      <div className="mt-8 space-y-4">
        {dict.legal.privacy.map((paragraph, i) => (
          <p key={i} className="text-navy-700">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}