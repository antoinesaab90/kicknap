import { NextResponse } from "next/server";
import { serviceBaseUrl } from "@/lib/api";

// GET /api/spaces/[id]/hours — weekly opening rules for a space (public).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }
  const res = await fetch(
    `${serviceBaseUrl("availability")}/api/v1/spaces/${id}/hours`,
    { cache: "no-store" }
  );
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return NextResponse.json(data, { status: res.status });
}