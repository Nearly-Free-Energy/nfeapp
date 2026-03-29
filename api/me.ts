import { createClient } from '@supabase/supabase-js';

function getServerAllowedEmails(): string[] {
  return (process.env.VITE_ALLOWED_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isServerEmailAllowed(email: string | undefined): boolean {
  if (!email) {
    return false;
  }

  const allowedEmails = getServerAllowedEmails();
  if (allowedEmails.length === 0) {
    return true;
  }

  return allowedEmails.includes(email.toLowerCase());
}

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length);
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

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405 });
  }

  const token = extractBearerToken(request);
  if (!token) {
    return Response.json({ error: 'Missing bearer token.' }, { status: 401 });
  }

  try {
    const user = await verifyAccessToken(token);

    if (!isServerEmailAllowed(user.email)) {
      return Response.json({ error: 'This account is not enabled for portal access yet.' }, { status: 403 });
    }

    return Response.json({
      email: user.email,
      allowed: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to verify your session.';
    return Response.json({ error: message }, { status: 401 });
  }
}
