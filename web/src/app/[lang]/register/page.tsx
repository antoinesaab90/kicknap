import Link from "next/link";
import { lang } from "next/root-params";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { RegisterForm } from "@/components/register-form";

export default async function RegisterPage({
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
        <RegisterForm
          lang={currentLang}
          next={next}
          texts={{
            title: dict.auth.registerTitle,
            subtitle: dict.auth.registerSubtitle,
            name: dict.auth.name,
            email: dict.auth.email,
            password: dict.auth.password,
            submit: dict.auth.signUp,
            signingUp: dict.auth.signingUp,
            genericError: dict.auth.genericError,
            invalidEmail: dict.auth.invalidEmail,
            weakPassword: dict.auth.weakPassword,
            emailTaken: dict.auth.emailTaken,
            missingName: dict.auth.missingName,
          }}
        />
        <p className="mx-auto mt-6 max-w-sm text-center text-sm text-navy-600">
          {dict.auth.alreadyAccount}{" "}
          <Link
            href={`/${currentLang}/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-semibold text-navy-800 underline-offset-2 hover:underline"
          >
            {dict.auth.loginLink}
          </Link>
        </p>
      </div>
    </div>
  );
}