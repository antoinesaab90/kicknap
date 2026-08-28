import { NextResponse } from "next/server";
import { requireHost } from "@/lib/host";
import { serviceBaseUrl } from "@/lib/api";

export async function POST(
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

  let published: boolean;
  try {
    const body = (await request.json()) as { published?: unknown };
    published = body.published === true;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const res = await fetch(`${serviceBaseUrl("listings")}/api/v1/spaces/${spaceId}/publish`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ hostEmail: host.email, published }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return NextResponse.json(data, { status: res.ok ? 200 : res.status });
}