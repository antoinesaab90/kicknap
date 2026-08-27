export interface CheckResult {
  available: boolean;
  reason: string;
  spaceId?: number;
}

const base = process.env.SERVICE_AVAILABILITY_URL ?? "http://localhost:3002";

export async function checkAvailability(
  spaceId: number,
  from: string,
  to: string
): Promise<CheckResult> {
  const res = await fetch(
    `${base}/api/v1/check?spaceId=${spaceId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    return { available: false, reason: `availability_service_error_${res.status}` };
  }
  return (await res.json()) as CheckResult;
}