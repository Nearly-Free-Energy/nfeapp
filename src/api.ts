export type MeApiResponse = {
  email: string;
  allowed: true;
};

export async function getMe(accessToken: string): Promise<MeApiResponse> {
  const response = await fetch('/api/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof payload.error === 'string' ? payload.error : 'Unable to verify your session.');
  }

  return payload as unknown as MeApiResponse;
}
