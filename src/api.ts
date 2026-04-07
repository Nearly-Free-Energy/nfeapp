import type { MeApiResponse } from './models/customer';
import type { UsageApiResponse } from './models/usage';

export async function getMe(accessToken: string): Promise<MeApiResponse> {
  return requestJson<MeApiResponse>('/api/me', accessToken, 'Unable to verify your session.');
}

export async function getUsage(accessToken: string): Promise<UsageApiResponse> {
  return requestJson<UsageApiResponse>('/api/usage', accessToken, 'Unable to load usage.');
}

async function requestJson<T>(url: string, accessToken: string, defaultErrorMessage: string): Promise<T> {
  const response = await fetch(url, {
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
      throw new Error(body.split('\n')[0] || defaultErrorMessage);
    }

    throw new Error(defaultErrorMessage);
  }

  if (!payload) {
    throw new Error(defaultErrorMessage);
  }

  return payload as unknown as T;
}
