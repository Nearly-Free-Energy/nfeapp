import { afterEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

describe('/api/me', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    mockGetUser.mockReset();
  });

  it('returns 401 without a bearer token', async () => {
    const { default: handler } = await import('../api/me');

    const response = await handler(new Request('http://localhost/api/me'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Missing bearer token.',
    });
  });

  it('returns 401 when token verification fails', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('bad token'),
    });

    const { default: handler } = await import('../api/me');
    const response = await handler(
      new Request('http://localhost/api/me', {
        headers: {
          Authorization: 'Bearer bad-token',
        },
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Unable to verify the Supabase session.',
    });
  });

  it('returns 403 for an authenticated user outside the allowlist', async () => {
    vi.stubEnv('VITE_ALLOWED_EMAILS', 'allowed@example.com');
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          email: 'blocked@example.com',
        },
      },
      error: null,
    });

    const { default: handler } = await import('../api/me');
    const response = await handler(
      new Request('http://localhost/api/me', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: 'This account is not enabled for portal access yet.',
    });
  });

  it('returns 200 with email for a valid allowed user', async () => {
    vi.stubEnv('VITE_ALLOWED_EMAILS', 'customer@example.com');
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          email: 'customer@example.com',
        },
      },
      error: null,
    });

    const { default: handler } = await import('../api/me');
    const response = await handler(
      new Request('http://localhost/api/me', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      email: 'customer@example.com',
      allowed: true,
    });
  });
});
