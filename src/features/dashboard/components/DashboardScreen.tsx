import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

type DashboardScreenProps = {
  email: string;
  accountName: string;
  onSignOut: () => Promise<void>;
  children: ReactNode;
};

export function DashboardScreen({ email, accountName, onSignOut, children }: DashboardScreenProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <main className="app-shell">
      <section className="dashboard-card">
        <header className="portal-topbar">
          <div className="eyebrow">Customer energy portal</div>
          <button
            type="button"
            className="menu-toggle"
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
            aria-controls="portal-side-menu"
            onClick={() => setIsMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
        </header>

        {isMenuOpen ? (
          <button type="button" className="side-menu-backdrop" aria-label="Close menu" onClick={() => setIsMenuOpen(false)} />
        ) : null}

        <aside id="portal-side-menu" className={isMenuOpen ? 'side-menu side-menu--open' : 'side-menu'}>
          <div className="side-menu__header">
            <div>
              <div className="side-menu__eyebrow">Customer portal</div>
              <div className="side-menu__account">{accountName}</div>
            </div>
            <button type="button" className="side-menu__close" aria-label="Close menu" onClick={() => setIsMenuOpen(false)}>
              ×
            </button>
          </div>

          <nav className="section-nav" aria-label="Portal sections">
            <NavLink
              to="/usage"
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) => (isActive ? 'section-nav__link section-nav__link--active' : 'section-nav__link')}
            >
              Usage
            </NavLink>
            <NavLink
              to="/account"
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) => (isActive ? 'section-nav__link section-nav__link--active' : 'section-nav__link')}
            >
              Account
            </NavLink>
          </nav>

          <div className="side-menu__footer">
            <div className="side-menu__email">{email}</div>
            <button type="button" className="ghost-button" onClick={() => void onSignOut()}>
              Sign out
            </button>
          </div>
        </aside>
        {children}
      </section>
    </main>
  );
}
