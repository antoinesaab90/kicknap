import { NextResponse } from "next/server";
import { serviceBaseUrl } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get("spaceId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!spaceId || !from || !to) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const url =
    `${serviceBaseUrl("availability")}/api/v1/check?` +
    `spaceId=${encodeURIComponent(spaceId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  const res = await fetch(url, { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return NextResponse.json(data, { status: res.status });
}