"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function safeNext(next: string | undefined, lang: string): string {
  if (!next) return `/${lang}`;
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return `/${lang}`;
}

export function RegisterForm({
  lang,
  next,
  texts,
}: {
  lang: string;
  next?: string;
  texts: {
    title: string;
    subtitle: string;
    name: string;
    email: string;
    password: string;
    submit: string;
    signingUp: string;
    genericError: string;
    invalidEmail: string;
    weakPassword: string;
    emailTaken: string;
    missingName: string;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function messageFor(code: string): string {
    switch (code) {
      case "invalid_email":
        return texts.invalidEmail;
      case "weak_password":
        return texts.weakPassword;
      case "email_taken":
        return texts.emailTaken;
      case "missing_name":
        return texts.missingName;
      default:
        return texts.genericError;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      if (res.ok) {
        router.push(safeNext(next, lang));
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(messageFor(data.error ?? ""));
    } catch {
      setError(texts.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{texts.title}</h1>
      <p className="mt-2 text-sm text-navy-600">{texts.subtitle}</p>

      <label className="mt-6 block text-sm font-medium text-navy-800">
        {texts.name}
        <input
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-navy-900 transition-colors focus:border-gold-600 focus:outline-none"
        />
      </label>

      <label className="mt-4 block text-sm font-medium text-navy-800">
        {texts.email}
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-navy-900 transition-colors focus:border-gold-600 focus:outline-none"
        />
      </label>

      <label className="mt-4 block text-sm font-medium text-navy-800">
        {texts.password}
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-navy-900 transition-colors focus:border-gold-600 focus:outline-none"
        />
      </label>

      {error && <p className="mt-4 text-sm font-medium text-rose-700">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-full bg-navy-800 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-60"
      >
        {submitting ? texts.signingUp : texts.submit}
      </button>
    </form>
  );
}