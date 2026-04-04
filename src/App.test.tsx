import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import type { MeApiResponse } from './models/customer';

const authStateListeners: Array<(event: string, session: unknown) => void> = [];
const apiMocks = vi.hoisted(() => ({
  getMe: vi.fn(async (): Promise<MeApiResponse> => ({
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
        id: 'service-demo',
        serviceType: 'electric',
        serviceName: 'Customer Demo Account Electric Service',
        serviceAddress: null,
        status: 'active',
      },
    ],
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
  function renderApp(initialEntry = '/') {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>,
    );
  }

  afterEach(() => {
    vi.restoreAllMocks();
    authStateListeners.length = 0;
    apiMocks.getMe.mockReset();
    apiMocks.getMe.mockResolvedValue({
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
          id: 'service-demo',
          serviceType: 'electric',
          serviceName: 'Customer Demo Account Electric Service',
          serviceAddress: null,
          status: 'active',
        },
      ],
    });
  });

  it('renders the signed-in dashboard and keeps controls at the bottom', async () => {
    renderApp();

    expect(await screen.findByText(/Signed in as customer@example.com for Customer Demo Account/i)).toBeInTheDocument();
    expect(apiMocks.getMe).toHaveBeenCalledWith('test-token');
    expect(screen.getByRole('heading', { name: 'Electricity Consumption' })).toBeInTheDocument();
    expect(screen.getByLabelText('Weekly utility usage')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Usage' })).toHaveClass('section-nav__link--active');
    expect(screen.getByRole('link', { name: 'Account' })).toBeInTheDocument();

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
    renderApp();

    await screen.findByLabelText('Weekly utility usage');
    await user.click(screen.getByRole('button', { name: 'Month' }));

    expect(screen.getByLabelText('Monthly utility usage')).toBeInTheDocument();
    expect(screen.getByText('Mar 2026')).toBeInTheDocument();
  });

  it('navigates periods forward from weekly view', async () => {
    const user = userEvent.setup();
    renderApp();

    await screen.findByLabelText('Weekly utility usage');
    await user.click(screen.getByRole('button', { name: 'Next period' }));

    expect(screen.getByText('Mar 29 - Apr 4')).toBeInTheDocument();
  });

  it('renders the sign-in form when there is no session', async () => {
    const { supabase } = await import('./supabase');
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    } as never);

    renderApp();

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
    renderApp();

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
    renderApp();

    await screen.findByRole('heading', { name: 'Electricity Consumption' });
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('returns to the signed-out state when backend verification fails', async () => {
    apiMocks.getMe.mockRejectedValueOnce(new Error('Unable to verify your session.'));

    renderApp();

    expect(await screen.findByText('Unable to verify your session.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign in to view your energy dashboard' })).toBeInTheDocument();
  });

  it('shows the unmapped-user message when the backend rejects a signed-in user without a customer profile', async () => {
    apiMocks.getMe.mockRejectedValueOnce(
      new Error('Your account is signed in, but it is not linked to a customer profile yet.'),
    );

    renderApp();

    expect(
      await screen.findByText('Your account is signed in, but it is not linked to a customer profile yet.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign in to view your energy dashboard' })).toBeInTheDocument();
  });

  it('renders the account route with customer profile and services', async () => {
    renderApp('/account');

    expect(await screen.findByLabelText('Account overview')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Account' })).toHaveClass('section-nav__link--active');
    expect(screen.getByText('Customer Demo Profile')).toBeInTheDocument();
    expect(screen.getByText('Customer Demo Account Electric Service')).toBeInTheDocument();
  });
});
