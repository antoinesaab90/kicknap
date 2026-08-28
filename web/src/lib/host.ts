import { clearSession, getSession } from "@/lib/auth";
import { identifyUser } from "@/lib/api";

export interface HostUser {
  email: string;
  name: string;
}

export async function requireHost(): Promise<HostUser | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await identifyUser(session.token);
  if (!user) {
    await clearSession();
    return null;
  }
  return { email: user.email, name: user.name };
}