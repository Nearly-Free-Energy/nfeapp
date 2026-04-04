type AuthStatusScreenProps = {
  title: string;
  message: string;
};

export function AuthStatusScreen({ title, message }: AuthStatusScreenProps) {
  return (
    <main className="app-shell">
      <section className="dashboard-card dashboard-card--narrow">
        <div className="eyebrow">Customer energy portal</div>
        <h1>{title}</h1>
        <p className="subtitle">{message}</p>
      </section>
    </main>
  );
}
