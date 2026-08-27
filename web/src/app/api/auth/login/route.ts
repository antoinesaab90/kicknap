import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth";
import { serviceBaseUrl } from "@/lib/api";
import type { LoginResponse } from "@/lib/types/auth";

export async function POST(request: Request) {
  let email = "";
  let password = "";
  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "missing_credentials" }, { status: 400 });
  }

  const res = await fetch(`${serviceBaseUrl("identity")}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as Partial<LoginResponse> & {
    error?: string;
  };

  if (!res.ok) {
    return NextResponse.json({ error: data.error ?? "invalid_credentials" }, { status: res.status });
  }

  if (!data.token || !data.user) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  await setSession(data.token, data.user.email);
  return NextResponse.json({ ok: true, user: data.user });
}