import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "@/lib/i18n/config";

function detectLocale(request: NextRequest): string {
  const header = request.headers.get("accept-language") ?? "";
  const preferred = header
    .split(",")
    .map((part) => {
      const [tag, ...rest] = part.trim().split(";");
      const qRaw = rest.find((r) => r.trim().startsWith("q="));
      const q = qRaw ? parseFloat(qRaw.trim().slice(2)) : 1;
      return { tag: tag.toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of preferred) {
    const base = tag.split("-")[0];
    if ((locales as readonly string[]).includes(base)) return base;
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (pathnameHasLocale) return;

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/|api/|favicon|.*\\.(?:png|jpg|jpeg|svg|ico|webp|txt|xml|json|webmanifest)$).*)",
  ],
};