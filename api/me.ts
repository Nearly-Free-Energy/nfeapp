import { createAuthVerifier, extractBearerToken, isServerEmailAllowed } from './_lib/auth';

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
