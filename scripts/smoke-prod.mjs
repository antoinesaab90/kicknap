const ENDPOINTS = {
  listings: "https://listings-hazel.vercel.app",
  availability: "https://availability-xi.vercel.app",
  bookings: "https://bookings-sable-nine.vercel.app",
  identity: "https://identity-wheat-ten.vercel.app",
  payments: "https://payments-olive.vercel.app",
  web: "https://www.kicknap.com",
};

const results = [];

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
  } catch (err) {
    results.push({ name, ok: false, detail: err instanceof Error ? err.message : String(err) });
  }
}

const get = async (url, ops) => {
  const res = await fetch(url, ops);
  let body = null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("json")) {
    body = await res.json().catch(() => null);
  } else {
    body = await res.text().catch(() => "");
  }
  return { status: res.status, body };
};

const expectStatus = (wanted, received) => {
  if (received !== wanted) throw new Error(`expected ${wanted}, got ${received}`);
};

await check("listings /health", async () => {
  const r = await get(`${ENDPOINTS.listings}/health`);
  expectStatus(200, r.status);
  if (!r.body?.ok) throw new Error("health not ok");
  return "ok";
});

await check("listings /spaces", async () => {
  const r = await get(`${ENDPOINTS.listings}/api/v1/spaces`);
  expectStatus(200, r.status);
  if (!Array.isArray(r.body?.spaces) || r.body.spaces.length < 1) throw new Error("no spaces");
  return `${r.body.spaces.length} spaces`;
});

await check("availability /health", async () => {
  const r = await get(`${ENDPOINTS.availability}/health`);
  expectStatus(200, r.status);
  return "ok";
});

await check("availability check sl", async () => {
  const q = "spaceId=21&from=2026-09-01T10:00:00%2B02:00&to=2026-09-01T12:00:00%2B02:00";
  const r = await get(`${ENDPOINTS.availability}/api/v1/check?${q}`);
  expectStatus(200, r.status);
  if (r.body?.available !== true) throw new Error(`not available: ${JSON.stringify(r.body)}`);
  return "available:true";
});

await check("bookings /health", async () => {
  const r = await get(`${ENDPOINTS.bookings}/health`);
  expectStatus(200, r.status);
  return "ok";
});

await check("bookings /list", async () => {
  const r = await get(`${ENDPOINTS.bookings}/api/v1/bookings`);
  expectStatus(200, r.status);
  return `${r.body?.count ?? 0} active`;
});

await check("identity /health", async () => {
  const r = await get(`${ENDPOINTS.identity}/health`);
  expectStatus(200, r.status);
  return "ok";
});

await check("identity /me no token", async () => {
  const r = await get(`${ENDPOINTS.identity}/api/v1/auth/me`);
  expectStatus(401, r.status);
  return "401 as expected";
});

await check("payments /health", async () => {
  const r = await get(`${ENDPOINTS.payments}/health`);
  expectStatus(200, r.status);
  return `stripeConfigured:${r.body?.stripeConfigured === true}`;
});

await check("web / (redirect)", async () => {
  const r = await get(`${ENDPOINTS.web}/`, { redirect: "manual" });
  if (![301, 302, 307, 308].includes(r.status)) throw new Error(`expected redirect, got ${r.status}`);
  return r.status;
});

await check("web /en", async () => {
  const r = await get(`${ENDPOINTS.web}/en`);
  expectStatus(200, r.status);
  if (!r.body.includes("A base between")) throw new Error("marker missing");
  return "page ok";
});

await check("web /en/search", async () => {
  const r = await get(`${ENDPOINTS.web}/en/search`);
  expectStatus(200, r.status);
  return "page ok";
});

await check("web /en/spaces/21", async () => {
  const r = await get(`${ENDPOINTS.web}/en/spaces/21`);
  expectStatus(200, r.status);
  if (!r.body.includes("Pick a day above to see its available times.")) throw new Error("booking panel missing");
  return "detail page ok";
});

await check("web /en/spaces/14 all-in price", async () => {
  const r = await get(`${ENDPOINTS.web}/en/spaces/14`);
  expectStatus(200, r.status);
  if (!r.body.includes("€37.50")) throw new Error("all-in session price missing");
  return "€37.50 shown";
});

await check("web /en/search all-in hourly price", async () => {
  const r = await get(`${ENDPOINTS.web}/en/search`);
  expectStatus(200, r.status);
  if (!r.body.includes("€12.50")) throw new Error("all-in hourly price missing");
  return "€12.50 shown";
});

await check("web /en/login", async () => {
  const r = await get(`${ENDPOINTS.web}/en/login`);
  expectStatus(200, r.status);
  if (!r.body.includes("Log in to book")) throw new Error("login page missing");
  return "page ok";
});

await check("web /en/bookings", async () => {
  const r = await get(`${ENDPOINTS.web}/en/bookings`);
  expectStatus(200, r.status);
  return "page ok";
});

let pass = 0;
let fail = 0;
for (const r of results) {
  const mark = r.ok ? "PASS" : "FAIL";
  if (r.ok) pass += 1;
  else fail += 1;
  process.stdout.write(`[${mark}] ${r.name} — ${r.detail}\n`);
}
process.stdout.write(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail > 0 ? 1 : 0);