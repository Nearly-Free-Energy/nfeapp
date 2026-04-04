import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { AccountHeader } from '../../account/components/AccountHeader';

type DashboardScreenProps = {
  email: string;
  accountName: string;
  onSignOut: () => Promise<void>;
  children: ReactNode;
};

export function DashboardScreen({ email, accountName, onSignOut, children }: DashboardScreenProps) {
  return (
    <main className="app-shell">
      <section className="dashboard-card">
        <div className="eyebrow">Customer energy portal</div>
        <AccountHeader email={email} accountName={accountName} onSignOut={onSignOut} />
        <nav className="section-nav" aria-label="Portal sections">
          <NavLink
            to="/usage"
            className={({ isActive }) => (isActive ? 'section-nav__link section-nav__link--active' : 'section-nav__link')}
          >
            Usage
          </NavLink>
          <NavLink
            to="/account"
            className={({ isActive }) => (isActive ? 'section-nav__link section-nav__link--active' : 'section-nav__link')}
          >
            Account
          </NavLink>
        </nav>
        {children}
      </section>
    </main>
  );
}
