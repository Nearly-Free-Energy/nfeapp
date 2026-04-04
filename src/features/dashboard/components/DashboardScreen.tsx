import { AccountHeader } from '../../account/components/AccountHeader';
import { UsageOverview } from '../../usage/components/UsageOverview';

type DashboardScreenProps = {
  email: string;
  customerName: string | null;
  onSignOut: () => Promise<void>;
};

export function DashboardScreen({ email, customerName, onSignOut }: DashboardScreenProps) {
  return (
    <main className="app-shell">
      <section className="dashboard-card">
        <div className="eyebrow">Customer energy portal</div>
        <AccountHeader email={email} customerName={customerName} onSignOut={onSignOut} />
        <UsageOverview />
      </section>
    </main>
  );
}
