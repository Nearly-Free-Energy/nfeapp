import { Session } from '@supabase/supabase-js';
import { FormEvent, useEffect, useState } from 'react';
import { getMe } from './api';
import { isEmailAllowed } from './auth';
import { BottomControlTray } from './components/BottomControlTray';
import { EnergySummary } from './components/EnergySummary';
import { MonthlyCalendar } from './components/MonthlyCalendar';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { MOCK_ENERGY_DAYS, MOCK_TODAY } from './data/mockEnergy';
import { supabase } from './supabase';
import type { EnergyCalendarView } from './types';
import { addDays, addMonths, endOfWeek, formatMonthYear, formatWeekRange, parseIsoDate, startOfWeek } from './utils/date';
import { buildEnergyLookup, getMonthDays, getWeekDays, summarizePeriod } from './utils/energy';

const INITIAL_ANCHOR_DATE = parseIsoDate('2026-03-22');

function App() {
  const [view, setView] = useState<EnergyCalendarView>('week');
  const [anchorDate, setAnchorDate] = useState<Date>(INITIAL_ANCHOR_DATE);
  const [selectedDayKey, setSelectedDayKey] = useState<string | undefined>(undefined);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [email, setEmail] = useState('');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }

      if (error) {
        setAuthError(error.message);
      } else {
        setSession(data.session);
        setVerifiedEmail(null);
        setCustomerName(null);
        if (data.session?.user.email) {
          setEmail(data.session.user.email);
        }
      }

      setIsAuthReady(true);
    }

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsAuthReady(true);
      setVerifiedEmail(null);
      setCustomerName(null);

      if (nextSession?.user.email) {
        setEmail(nextSession.user.email);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      if (!session?.access_token) {
        setVerifiedEmail(null);
        setCustomerName(null);
        setIsVerifyingSession(false);
        return;
      }

      const sessionEmail = session.user.email;
      if (!sessionEmail || isEmailAllowed(sessionEmail)) {
        setIsVerifyingSession(true);

        try {
          const profile = await getMe(session.access_token);
          if (!isMounted) {
            return;
          }

          setVerifiedEmail(profile.email);
          setCustomerName(profile.customerName);
          setAuthError(null);
        } catch (error) {
          if (!isMounted) {
            return;
          }

          setVerifiedEmail(null);
          setCustomerName(null);
          setAuthMessage(null);

          const message = error instanceof Error ? error.message : 'Unable to verify your session.';
          await supabase.auth.signOut();
          setSession(null);
          setAuthError(message);
        } finally {
          if (isMounted) {
            setIsVerifyingSession(false);
          }
        }

        return;
      }

      await supabase.auth.signOut();
      if (!isMounted) {
        return;
      }

      setSession(null);
      setVerifiedEmail(null);
      setCustomerName(null);
      setAuthMessage(null);
      setAuthError('This account is not enabled for portal access yet.');
      setSelectedDayKey(undefined);
    }

    void verifySession();

    return () => {
      isMounted = false;
    };
  }, [session]);

  const energyLookup = buildEnergyLookup(MOCK_ENERGY_DAYS);
  const weekDays = getWeekDays(anchorDate, energyLookup, MOCK_TODAY);
  const monthDays = getMonthDays(anchorDate, energyLookup, MOCK_TODAY);
  const visibleDays = view === 'week' ? weekDays : monthDays.filter((day) => day.isCurrentMonth);
  const summary = summarizePeriod(visibleDays);
  const periodLabel =
    view === 'week' ? formatWeekRange(startOfWeek(anchorDate), endOfWeek(anchorDate)) : formatMonthYear(anchorDate);
  const signedInEmail = verifiedEmail ?? session?.user.email ?? 'Signed in customer';

  function handleNavigate(step: -1 | 1) {
    setSelectedDayKey(undefined);
    setAnchorDate((current) => (view === 'week' ? addDays(current, step * 7) : addMonths(current, step)));
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    setIsSendingLink(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setAuthMessage('Check your email for the secure sign-in link.');
    }

    setIsSendingLink(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
    setVerifiedEmail(null);
    setCustomerName(null);
    setSelectedDayKey(undefined);
    setAuthMessage(null);
    setAuthError(null);
  }

  if (!isAuthReady) {
    return (
      <main className="app-shell">
        <section className="dashboard-card dashboard-card--narrow">
          <div className="eyebrow">Customer energy portal</div>
          <h1>Electricity Consumption</h1>
          <p className="subtitle">Checking your session...</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="app-shell">
        <section className="dashboard-card dashboard-card--narrow">
          <div className="eyebrow">Customer energy portal</div>
          <div className="auth-card">
            <h1>Sign in to view your energy dashboard</h1>
            <p className="subtitle">
              Enter your email address and we&apos;ll send you a secure sign-in link. For now, the dashboard still uses
              demo data after sign-in while we complete the real-data integration.
            </p>

            {authError ? (
              <div className="status-banner status-banner--error" role="alert">
                {authError}
              </div>
            ) : null}

            {authMessage ? (
              <div className="status-banner status-banner--info" role="status">
                {authMessage}
              </div>
            ) : null}

            <form className="auth-form" onSubmit={handleSignIn}>
              <label className="auth-form__label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                className="auth-form__input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
              <button type="submit" className="auth-form__button" disabled={isSendingLink}>
                {isSendingLink ? 'Sending link...' : 'Send sign-in link'}
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  if (isVerifyingSession || !verifiedEmail) {
    return (
      <main className="app-shell">
        <section className="dashboard-card dashboard-card--narrow">
          <div className="eyebrow">Customer energy portal</div>
          <h1>Electricity Consumption</h1>
          <p className="subtitle">Verifying your secure session...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="dashboard-card">
        <div className="eyebrow">Customer energy portal</div>
        <div className="header-row">
          <div>
            <h1>Electricity Consumption</h1>
            <p className="subtitle">
              Signed in as {signedInEmail} for {customerName ?? 'your customer account'}. Demo data is still shown while
              real customer integrations are being wired in.
            </p>
          </div>
          <button type="button" className="ghost-button" onClick={() => void handleSignOut()}>
            Sign out
          </button>
        </div>

        <EnergySummary summary={summary} />

        {view === 'week' ? (
          <WeeklyCalendar days={weekDays} selectedKey={selectedDayKey} onSelect={setSelectedDayKey} />
        ) : (
          <MonthlyCalendar days={monthDays} selectedKey={selectedDayKey} onSelect={setSelectedDayKey} />
        )}

        <BottomControlTray
          label={periodLabel}
          view={view}
          onPrevious={() => handleNavigate(-1)}
          onNext={() => handleNavigate(1)}
          onChangeView={setView}
        />
      </section>
    </main>
  );
}

export default App;
