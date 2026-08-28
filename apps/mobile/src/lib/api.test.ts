import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkMany, createCheckout } from '@/lib/api';

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  fetchMock.mockReset();
});

describe('http client', () => {
  it('parses JSON on success', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ checkoutSessionId: 'cs_test_1', url: 'https://checkout.stripe.com/1' })
    );
    const session = await createCheckout({
      bookingId: 1,
      successUrl: 'kicknap://booking-result?booking=1',
      cancelUrl: 'kicknap://search',
    });
    expect(session.url).toBe('https://checkout.stripe.com/1');
    expect(session.checkoutSessionId).toBe('cs_test_1');
  });

  it('throws the server error message on 4xx', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'already_paid' }, 409));
    await expect(
      createCheckout({ bookingId: 1, successUrl: '', cancelUrl: '' })
    ).rejects.toThrow('already_paid');
  });

  it('throws a generic message when the body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('oops', { status: 500 }));
    await expect(
      createCheckout({ bookingId: 1, successUrl: '', cancelUrl: '' })
    ).rejects.toThrow('HTTP 500');
  });
});

describe('qs building (checkMany)', () => {
  it('sends from/to as URL-encoded query params', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ available: 1, total: 2, results: [{ spaceId: 1, available: true }] })
    );
    await checkMany('2026-07-15T08:30:00.000Z', '2026-07-15T10:30:00.000Z');
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain('/api/v1/check-many?');
    expect(url).toContain('from=2026-07-15T08%3A30%3A00.000Z');
    expect(url).toContain('to=2026-07-15T10%3A30%3A00.000Z');
  });

  it('omits empty params entirely', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ spaces: [] }));
    const { listSpaces } = await import('@/lib/api');
    await listSpaces({});
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url.endsWith('/api/v1/spaces')).toBe(true);
  });
});