import { NextResponse } from "next/server";
import { requireHost } from "@/lib/host";
import { serviceBaseUrl } from "@/lib/api";
import type { OpeningRuleDto } from "@/lib/types/host";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const host = await requireHost();
  if (!host) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const spaceId = Number(id);
  if (!Number.isInteger(spaceId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  let spacePayload: Record<string, unknown>;
  let rules: OpeningRuleDto[];
  try {
    const body = (await request.json()) as { space?: unknown; rules?: unknown };
    spacePayload = (body.space ?? {}) as Record<string, unknown>;
    rules = Array.isArray(body.rules) ? (body.rules as OpeningRuleDto[]) : [];
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const update = await fetch(`${serviceBaseUrl("listings")}/api/v1/spaces/${spaceId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...spacePayload, hostEmail: host.email }),
    cache: "no-store",
  });
  const updated = (await update.json().catch(() => ({}))) as { space?: object; error?: string };
  if (!update.ok) return NextResponse.json(updated, { status: update.status });

  await fetch(`${serviceBaseUrl("availability")}/api/v1/spaces/${spaceId}/hours`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ hostEmail: host.email, rules }),
    cache: "no-store",
  });

  return NextResponse.json({ space: updated.space });
}