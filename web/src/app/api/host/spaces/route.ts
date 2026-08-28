import { NextResponse } from "next/server";
import { requireHost } from "@/lib/host";
import { serviceBaseUrl } from "@/lib/api";
import type { OpeningRuleDto } from "@/lib/types/host";

export async function GET() {
  const host = await requireHost();
  if (!host) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const res = await fetch(
    `${serviceBaseUrl("listings")}/api/v1/spaces?host=${encodeURIComponent(host.email)}`,
    { cache: "no-store" }
  );
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return NextResponse.json(data, { status: res.ok ? 200 : res.status });
}

export async function POST(request: Request) {
  const host = await requireHost();
  if (!host) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let spacePayload: Record<string, unknown>;
  let rules: OpeningRuleDto[];
  try {
    const body = (await request.json()) as { space?: unknown; rules?: unknown };
    spacePayload = (body.space ?? {}) as Record<string, unknown>;
    rules = Array.isArray(body.rules) ? (body.rules as OpeningRuleDto[]) : [];
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const create = await fetch(`${serviceBaseUrl("listings")}/api/v1/spaces`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...spacePayload, hostEmail: host.email }),
    cache: "no-store",
  });
  const created = (await create.json().catch(() => ({}))) as {
    space?: { id: number };
    error?: string;
  };
  if (!create.ok) return NextResponse.json(created, { status: create.status });

  const hours = await fetch(
    `${serviceBaseUrl("availability")}/api/v1/spaces/${created.space!.id}/hours`,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hostEmail: host.email, rules }),
      cache: "no-store",
    }
  );
  if (!hours.ok) {
    const hoursData = (await hours.json().catch(() => ({}))) as Record<string, unknown>;
    return NextResponse.json(hoursData, { status: hours.status });
  }

  return NextResponse.json({ space: created.space }, { status: 201 });
}