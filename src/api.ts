import type { MeApiResponse } from './models/customer';

export async function getMe(accessToken: string): Promise<MeApiResponse> {
  const response = await fetch('/api/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const body = await response.text();
  let payload: Record<string, unknown> | null = null;

  if (body) {
    try {
      payload = JSON.parse(body) as Record<string, unknown>;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    if (payload && typeof payload.error === 'string') {
      throw new Error(payload.error);
    }

    if (body) {
      throw new Error(body.split('\n')[0] || 'Unable to verify your session.');
    }

    throw new Error('Unable to verify your session.');
  }

  if (!payload) {
    throw new Error('Unable to verify your session.');
  }

  return payload as unknown as MeApiResponse;
}
