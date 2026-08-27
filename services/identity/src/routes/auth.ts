import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { users } from "../db/schema.js";
import { db } from "../db/index.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signToken, verifyToken } from "../lib/token.js";

const v1 = new Hono();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user: { id: number; email: string; name: string }) {
  return { id: user.id, email: user.email, name: user.name };
}

function bearerToken(header: string | undefined): string | null {
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length ? token : null;
}

// POST /api/v1/auth/register { email, password, name }
v1.post("/auth/register", async (c) => {
  const body = (await c.req.json().catch(() => null)) as {
    email?: unknown;
    password?: unknown;
    name?: unknown;
  } | null;
  if (!body) return c.json({ error: "invalid_body" }, 400);

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined;

  if (!EMAIL_RE.test(email)) return c.json({ error: "invalid_email" }, 400);
  if (password.length < 8) return c.json({ error: "weak_password" }, 400);
  if (!name) return c.json({ error: "missing_name" }, 400);

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) return c.json({ error: "email_taken" }, 409);

  const { salt, hash } = hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ email, name, passwordHash: hash, passwordSalt: salt })
    .returning();

  const token = signToken({ sub: String(user.id), email: user.email });
  return c.json({ token, user: publicUser(user) }, 201);
});

// POST /api/v1/auth/login { email, password }
v1.post("/auth/login", async (c) => {
  const body = (await c.req.json().catch(() => null)) as {
    email?: unknown;
    password?: unknown;
  } | null;
  if (!body) return c.json({ error: "invalid_body" }, 400);

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    return c.json({ error: "invalid_credentials" }, 401);
  }

  const token = signToken({ sub: String(user.id), email: user.email });
  return c.json({ token, user: publicUser(user) });
});

// GET /api/v1/auth/me  (Authorization: Bearer <token>)
v1.get("/auth/me", async (c) => {
  const token = bearerToken(c.req.header("Authorization"));
  if (!token) return c.json({ error: "unauthorized" }, 401);

  const payload = verifyToken(token);
  const sub = payload?.sub;
  if (typeof sub !== "string") return c.json({ error: "unauthorized" }, 401);

  const [user] = await db.select().from(users).where(eq(users.id, Number(sub))).limit(1);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  return c.json({ user: publicUser(user) });
});

export default v1;