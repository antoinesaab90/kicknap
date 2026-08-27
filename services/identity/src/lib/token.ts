import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = process.env.JWT_SECRET ?? "";

if (!SECRET) {
  throw new Error("JWT_SECRET is not set — add it to .env");
}

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function b64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

export function signToken(payload: Record<string, unknown>): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(
    JSON.stringify({ ...payload, iat: now, exp: now + TOKEN_TTL_SECONDS })
  );
  const signature = createHmac("sha256", SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): (Record<string, unknown> & { exp: number }) | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expected = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: Record<string, unknown> & { exp: number };
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
  if (typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
}