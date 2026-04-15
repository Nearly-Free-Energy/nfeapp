import { afterEach, describe, expect, it, vi } from 'vitest';

const mockCreateClient = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

describe('createServerSupabaseClient', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('requires a service role key for server-side data access', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_ANON_KEY', 'anon-key-only');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');

    const { createServerSupabaseClient } = await import('../server/supabase-admin.js');

    expect(() => createServerSupabaseClient()).toThrow(
      'Supabase server access is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('creates a non-persistent service-role client when configured', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'sb_secret_test');
    mockCreateClient.mockReturnValueOnce({ auth: {}, from: vi.fn() });

    const { createServerSupabaseClient } = await import('../server/supabase-admin.js');

    createServerSupabaseClient();

    expect(mockCreateClient).toHaveBeenCalledWith('https://example.supabase.co', 'sb_secret_test', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  });
});
