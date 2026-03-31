import { createClient } from '@supabase/supabase-js';
import { customerMap, type CustomerRecord } from '../server/customer-map.js';

type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
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

function getCustomerRecord(email: string): CustomerRecord | null {
  const record = customerMap[email.toLowerCase()];
  return record ?? null;
}

function createAuthVerifier() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return async () => {
      throw new Error('Supabase auth is not configured.');
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

    const customer = getCustomerRecord(user.email);
    if (!customer) {
      response.status(403).json({ error: 'Your account is signed in, but it is not linked to a customer profile yet.' });
      return;
    }

    response.status(200).json({
      email: user.email,
      allowed: true,
      customerId: customer.customerId,
      customerName: customer.customerName,
    });
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to verify your session.';
    response.status(401).json({ error: message });
  }
}
