import { cookies } from "next/headers";

export const SESSION_COOKIE = "kn_session";
export const USER_COOKIE = "kn_user";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // matches identity token TTL (7 days)

export interface Session {
  token: string;
  email: string;
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return { token, email: store.get(USER_COOKIE)?.value ?? "" };
}

export async function setSession(token: string, email: string): Promise<void> {
  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
  store.set(SESSION_COOKIE, token, options);
  store.set(USER_COOKIE, email, { ...options, httpOnly: false });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(USER_COOKIE);
}