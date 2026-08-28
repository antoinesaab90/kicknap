import { NextResponse } from "next/server";
import { requireHost } from "@/lib/host";
import { serviceFetch } from "@/lib/api";

export async function GET() {
  const host = await requireHost();
  if (!host) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const res = await serviceFetch("payments", `/api/v1/payments/accounts/${encodeURIComponent(host.email)}`);
  if (res.status === 503 || res.status === 500) {
    return NextResponse.json({ error: "payments_unavailable" }, { status: 503 });
  }
  const data = (await res.json()) as { account: { accountId: string; onboarded: boolean; payoutsEnabled: boolean } | null };
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const host = await requireHost();
  if (!host) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { returnUrl?: unknown; refreshUrl?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const origin = new URL(request.url).origin;
  const defaultUrl = `${origin}/host`;
  const returnUrl = typeof body.returnUrl === "string" && body.returnUrl ? body.returnUrl : defaultUrl;
  const refreshUrl = typeof body.refreshUrl === "string" && body.refreshUrl ? body.refreshUrl : defaultUrl;

  const res = await serviceFetch("payments", `/api/v1/payments/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: host.email, returnUrl, refreshUrl }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "payments_unavailable" }, { status: 503 });
  }
  const data = (await res.json()) as { accountId: string; onboardingUrl: string; onboarded: boolean };
  return NextResponse.redirect(new URL(data.onboardingUrl), 303);
}

export const dynamic = "force-dynamic";