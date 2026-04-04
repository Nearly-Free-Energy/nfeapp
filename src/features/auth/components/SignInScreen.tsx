import { FormEvent } from 'react';

type SignInScreenProps = {
  email: string;
  authError: string | null;
  authMessage: string | null;
  isSendingLink: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function SignInScreen({
  email,
  authError,
  authMessage,
  isSendingLink,
  onEmailChange,
  onSubmit,
}: SignInScreenProps) {
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

          <form className="auth-form" onSubmit={onSubmit}>
            <label className="auth-form__label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              className="auth-form__input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
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
