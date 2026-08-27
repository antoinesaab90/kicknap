import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth";
import { identifyUser } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await identifyUser(session.token);
  if (!user) {
    await clearSession();
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user });
}