import { AccountHeader } from '../../account/components/AccountHeader';
import { UsageOverview } from '../../usage/components/UsageOverview';

type DashboardScreenProps = {
  email: string;
  accountName: string;
  onSignOut: () => Promise<void>;
};

export function DashboardScreen({ email, accountName, onSignOut }: DashboardScreenProps) {
  return (
    <main className="app-shell">
      <section className="dashboard-card">
        <div className="eyebrow">Customer energy portal</div>
        <AccountHeader email={email} accountName={accountName} onSignOut={onSignOut} />
        <UsageOverview />
      </section>
    </main>
  );
}
