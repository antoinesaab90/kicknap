import { NextResponse } from "next/server";
import { serviceFetch } from "@/lib/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const spaceId = Number(id);
  if (!Number.isInteger(spaceId) || spaceId <= 0) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const res = await serviceFetch("listings", `/api/v1/spaces/${spaceId}`);
  if (!res.ok) {
    return NextResponse.json({ error: "space_not_found" }, { status: res.status });
  }
  const data = (await res.json().catch(() => null)) as unknown;
  return NextResponse.json(data);
}