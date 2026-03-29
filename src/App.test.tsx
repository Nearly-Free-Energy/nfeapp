import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const authStateListeners: Array<(event: string, session: unknown) => void> = [];
const apiMocks = vi.hoisted(() => ({
  getMe: vi.fn(async () => ({
    email: 'customer@example.com',
    allowed: true as const,
    customerId: 'customer-demo',
    customerName: 'Customer Demo Account',
  })),
}));

vi.mock('./api', () => ({
  getMe: apiMocks.getMe,
}));

vi.mock('./supabase', () => {
  const signInWithOtp = vi.fn(async () => ({ error: null }));
  const signOut = vi.fn(async () => ({ error: null }));
  const getSession = vi.fn(async () => ({
    data: {
      session: {
        access_token: 'test-token',
        user: {
          email: 'customer@example.com',
        },
      },
    },
    error: null,
  }));

  return {
    supabase: {
      auth: {
        signInWithOtp,
        signOut,
        getSession,
        onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
          authStateListeners.push(callback);
          return {
            data: {
              subscription: {
                unsubscribe: vi.fn(),
              },
            },
          };
        },
      },
    },
  };
});

describe('Electricity consumption dashboard', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_ALLOWED_EMAILS', '');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    authStateListeners.length = 0;
    apiMocks.getMe.mockReset();
    apiMocks.getMe.mockResolvedValue({
      email: 'customer@example.com',
      allowed: true,
      customerId: 'customer-demo',
      customerName: 'Customer Demo Account',
    });
  });

  it('renders the signed-in dashboard and keeps controls at the bottom', async () => {
    render(<App />);

    expect(await screen.findByText(/Signed in as customer@example.com for Customer Demo Account/i)).toBeInTheDocument();
    expect(apiMocks.getMe).toHaveBeenCalledWith('test-token');
    expect(screen.getByRole('heading', { name: 'Electricity Consumption' })).toBeInTheDocument();
    expect(screen.getByLabelText('Weekly energy usage')).toBeInTheDocument();

    for (const weekday of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
      expect(screen.getByText(weekday, { selector: 'span' })).toBeInTheDocument();
    }

    const controls = screen.getByLabelText('Bottom calendar controls');
    expect(within(controls).getByRole('button', { name: 'Week' })).toBeInTheDocument();
    expect(within(controls).getByRole('button', { name: 'Month' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('switches to month view and shows a month label', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByLabelText('Weekly energy usage');
    await user.click(screen.getByRole('button', { name: 'Month' }));

    expect(screen.getByLabelText('Monthly energy usage')).toBeInTheDocument();
    expect(screen.getByText('Mar 2026')).toBeInTheDocument();
  });

  it('navigates periods forward from weekly view', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByLabelText('Weekly energy usage');
    await user.click(screen.getByRole('button', { name: 'Next period' }));

    expect(screen.getByText('Mar 29 - Apr 4')).toBeInTheDocument();
  });

  it('renders the sign-in form when there is no session', async () => {
    const { supabase } = await import('./supabase');
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    } as never);

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Sign in to view your energy dashboard' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send sign-in link' })).toBeInTheDocument();
  });

  it('sends a magic link from the sign-in form', async () => {
    const { supabase } = await import('./supabase');
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    } as never);

    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { name: 'Sign in to view your energy dashboard' });
    await user.type(screen.getByLabelText('Email address'), 'person@example.com');
    await user.click(screen.getByRole('button', { name: 'Send sign-in link' }));

    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'person@example.com',
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    expect(await screen.findByText('Check your email for the secure sign-in link.')).toBeInTheDocument();
  });

  it('signs out when the user clicks sign out', async () => {
    const { supabase } = await import('./supabase');
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { name: 'Electricity Consumption' });
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('returns to the signed-out state when backend verification fails', async () => {
    apiMocks.getMe.mockRejectedValueOnce(new Error('Unable to verify your session.'));

    render(<App />);

    expect(await screen.findByText('Unable to verify your session.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign in to view your energy dashboard' })).toBeInTheDocument();
  });

  it('shows the unmapped-user message when the backend rejects a signed-in user without a customer profile', async () => {
    apiMocks.getMe.mockRejectedValueOnce(
      new Error('Your account is signed in, but it is not linked to a customer profile yet.'),
    );

    render(<App />);

    expect(
      await screen.findByText('Your account is signed in, but it is not linked to a customer profile yet.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign in to view your energy dashboard' })).toBeInTheDocument();
  });

  it('blocks a user that is not in the configured allowlist', async () => {
    vi.stubEnv('VITE_ALLOWED_EMAILS', 'allowed@example.com');
    vi.resetModules();

    const { supabase } = await import('./supabase');
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'test-token',
          user: {
            email: 'not-allowed@example.com',
          },
        },
      },
      error: null,
    } as never);

    const { default: ReloadedApp } = await import('./App');
    render(<ReloadedApp />);

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
    expect(await screen.findByText('This account is not enabled for portal access yet.')).toBeInTheDocument();

    vi.resetModules();
  });
});
