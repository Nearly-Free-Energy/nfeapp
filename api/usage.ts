import { createClient } from '@supabase/supabase-js';
import { fetchAuthorizedUsage } from '../server/usage-data.js';

type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  url?: string;
  query?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

function extractBearerToken(request: ApiRequest): string | null {
  const headerValue = request.headers.authorization;
  const header = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length);
}

function createAuthVerifier() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseServerKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseServerKey) {
    return async () => {
      throw new Error('Supabase auth is not configured.');
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServerKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return async function verifyAccessToken(accessToken: string) {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user?.email) {
      throw new Error('Unable to verify the Supabase session.');
    }

    return {
      email: data.user.email.toLowerCase(),
    };
  };
}

const verifyAccessToken = createAuthVerifier();

function extractServiceId(request: ApiRequest): string | null {
  const queryValue = request.query?.serviceId;
  if (typeof queryValue === 'string' && queryValue.trim().length > 0) {
    return queryValue.trim();
  }

  if (Array.isArray(queryValue) && queryValue[0]?.trim()) {
    return queryValue[0].trim();
  }

  if (!request.url) {
    return null;
  }

  const parsedUrl = new URL(request.url, 'http://localhost');
  const serviceId = parsedUrl.searchParams.get('serviceId');
  return serviceId?.trim() ? serviceId.trim() : null;
}

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const token = extractBearerToken(request);
  if (!token) {
    response.status(401).json({ error: 'Missing bearer token.' });
    return;
  }

  try {
    const user = await verifyAccessToken(token);
    const usage = await fetchAuthorizedUsage(user.email, extractServiceId(request));

    if (!usage) {
      response.status(403).json({ error: 'Your account is signed in, but it is not linked to usage data yet.' });
      return;
    }

    response.status(200).json(usage);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load usage.';
    const statusCode = error instanceof Error && error.name === 'InvalidServiceError' ? 403 : 401;
    response.status(statusCode).json({ error: message });
  }
}
