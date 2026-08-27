"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function safeNext(next: string | undefined, lang: string): string {
  if (!next) return `/${lang}`;
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return `/${lang}`;
}

export function LoginForm({
  lang,
  next,
  texts,
}: {
  lang: string;
  next?: string;
  texts: {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    submit: string;
    signingIn: string;
    error: string;
    demoHint: string;
    back: string;
  };
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push(safeNext(next, lang));
        router.refresh();
        return;
      }
      setError(texts.error);
    } catch {
      setError(texts.error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{texts.title}</h1>
      <p className="mt-2 text-sm text-navy-600">{texts.subtitle}</p>

      <label className="mt-6 block text-sm font-medium text-navy-800">
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
          autoComplete="current-password"
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
        {submitting ? texts.signingIn : texts.submit}
      </button>

      <p className="mt-6 rounded-2xl bg-navy-50 px-4 py-3 text-center text-xs leading-relaxed text-navy-600">
        {texts.demoHint}
      </p>
    </form>
  );
}