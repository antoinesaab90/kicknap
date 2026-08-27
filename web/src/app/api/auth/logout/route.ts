import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  await clearSession();
  const next = request.nextUrl.searchParams.get("next") ?? "/";
  const url = request.nextUrl.clone();
  url.pathname = next.startsWith("/") ? next : "/";
  url.search = "";
  return NextResponse.redirect(url);
}