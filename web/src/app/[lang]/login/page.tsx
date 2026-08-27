import Link from "next/link";
import { lang } from "next/root-params";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const currentLang = await lang();
  const dict = await getDictionary();
  const { next } = await searchParams;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <Link
        href={`/${currentLang}`}
        className="inline-block text-sm font-medium text-navy-600 transition-colors hover:text-navy-900"
      >
        ← kicknap
      </Link>
      <div className="mt-10">
        <LoginForm
          lang={currentLang}
          next={next}
          texts={{
            title: dict.auth.loginTitle,
            subtitle: dict.auth.loginSubtitle,
            email: dict.auth.email,
            password: dict.auth.password,
            submit: dict.auth.submit,
            signingIn: dict.auth.signingIn,
            error: dict.auth.error,
            demoHint: dict.auth.demoHint,
            back: "kicknap",
          }}
        />
      </div>
    </div>
  );
}