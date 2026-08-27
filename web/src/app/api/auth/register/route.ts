import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth";
import { serviceBaseUrl } from "@/lib/api";
import type { LoginResponse } from "@/lib/types/auth";

export async function POST(request: Request) {
  let email = "";
  let password = "";
  let name = "";
  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
      name?: unknown;
    };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    password = typeof body.password === "string" ? body.password : "";
    name = typeof body.name === "string" ? body.name.trim() : "";
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!email || !password || !name) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const res = await fetch(`${serviceBaseUrl("identity")}/api/v1/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, name }),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as Partial<LoginResponse> & {
    error?: string;
  };

  if (!res.ok) {
    return NextResponse.json({ error: data.error ?? "invalid_body" }, { status: res.status });
  }

  if (!data.token || !data.user) {
    return NextResponse.json({ error: "invalid_response" }, { status: 502 });
  }

  await setSession(data.token, data.user.email);
  return NextResponse.json({ ok: true, user: data.user }, { status: 201 });
}