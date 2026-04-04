import { afterEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  }),
}));

describe('/api/me', () => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'sb_secret_test');

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
    mockFrom.mockReset();
  });

  function createQueryChain(result: { data: unknown; error: Error | null }, options?: { resolveOnOrder?: boolean }) {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: options?.resolveOnOrder ? vi.fn().mockResolvedValue(result) : vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => result),
      then: undefined,
    };
  }

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

  it('returns 403 for an authenticated user without a customer mapping', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          email: 'blocked@example.com',
        },
      },
      error: null,
    });
    mockFrom.mockReturnValueOnce(createQueryChain({ data: null, error: null }));

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
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          email: 'customer@example.com',
        },
      },
      error: null,
    });
    mockFrom
      .mockReturnValueOnce(
        createQueryChain({
          data: {
            id: 'profile-demo',
            email: 'customer@example.com',
            display_name: 'Customer Demo Profile',
            status: 'active',
          },
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryChain({
          data: {
            id: 'account-demo',
            customer_profile_id: 'profile-demo',
            account_number: 'customer-demo',
            display_name: 'Customer Demo Account',
            status: 'active',
          },
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryChain({
          data: [
            {
              id: 'service-electric',
              utility_account_id: 'account-demo',
              service_type: 'electric',
              service_name: 'Customer Demo Account Electric Service',
              service_address: null,
              status: 'active',
            },
            {
              id: 'service-water',
              utility_account_id: 'account-demo',
              service_type: 'water',
              service_name: 'Customer Demo Account Water Service',
              service_address: '123 Main St',
              status: 'active',
            },
          ],
          error: null,
        }, { resolveOnOrder: true }),
      );

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
      profile: {
        id: 'profile-demo',
        displayName: 'Customer Demo Profile',
        status: 'active',
      },
      account: {
        id: 'account-demo',
        accountNumber: 'customer-demo',
        displayName: 'Customer Demo Account',
        status: 'active',
      },
      services: [
        {
          id: 'service-electric',
          serviceType: 'electric',
          serviceName: 'Customer Demo Account Electric Service',
          serviceAddress: null,
          status: 'active',
        },
        {
          id: 'service-water',
          serviceType: 'water',
          serviceName: 'Customer Demo Account Water Service',
          serviceAddress: '123 Main St',
          status: 'active',
        },
      ],
    });
  });
});
