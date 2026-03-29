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
  function createResponseRecorder() {
    let statusCode = 200;
    let jsonBody: unknown;

    const response = {
      status(code: number) {
        statusCode = code;
        return response;
      },
      json(body: unknown) {
        jsonBody = body;
      },
    };

    return {
      response,
      getStatus: () => statusCode,
      getBody: () => jsonBody,
    };
  }

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    mockGetUser.mockReset();
  });

  it('returns 401 without a bearer token', async () => {
    const { default: handler } = await import('../api/me');
    const recorder = createResponseRecorder();

    await handler(
      {
        method: 'GET',
        headers: {},
      },
      recorder.response,
    );

    expect(recorder.getStatus()).toBe(401);
    expect(recorder.getBody()).toMatchObject({
      error: 'Missing bearer token.',
    });
  });

  it('returns 401 when token verification fails', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('bad token'),
    });

    const { default: handler } = await import('../api/me');
    const recorder = createResponseRecorder();

    await handler(
      {
        method: 'GET',
        headers: {
          authorization: 'Bearer bad-token',
        },
      },
      recorder.response,
    );

    expect(recorder.getStatus()).toBe(401);
    expect(recorder.getBody()).toMatchObject({
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
    const recorder = createResponseRecorder();

    await handler(
      {
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
      },
      recorder.response,
    );

    expect(recorder.getStatus()).toBe(403);
    expect(recorder.getBody()).toMatchObject({
      error: 'This account is not enabled for portal access yet.',
    });
  });

  it('returns 403 for an allowlisted user without a customer mapping', async () => {
    vi.stubEnv('VITE_ALLOWED_EMAILS', 'missing@example.com');
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          email: 'missing@example.com',
        },
      },
      error: null,
    });

    const { default: handler } = await import('../api/me');
    const recorder = createResponseRecorder();

    await handler(
      {
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
      },
      recorder.response,
    );

    expect(recorder.getStatus()).toBe(403);
    expect(recorder.getBody()).toMatchObject({
      error: 'Your account is signed in, but it is not linked to a customer profile yet.',
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
    const recorder = createResponseRecorder();

    await handler(
      {
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
      },
      recorder.response,
    );

    expect(recorder.getStatus()).toBe(200);
    expect(recorder.getBody()).toEqual({
      email: 'customer@example.com',
      allowed: true,
      customerId: 'customer-demo',
      customerName: 'Customer Demo Account',
    });
  });
});
