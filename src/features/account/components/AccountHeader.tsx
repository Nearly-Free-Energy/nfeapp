type AccountHeaderProps = {
  email: string;
  accountName: string;
  onSignOut: () => Promise<void>;
};

export function AccountHeader({ email, accountName, onSignOut }: AccountHeaderProps) {
  return (
    <div className="header-row">
      <div>
        <h1>Electricity Consumption</h1>
        <p className="subtitle">
          Signed in as {email} for {accountName}. Demo data is still shown while real customer integrations are being
          wired in.
        </p>
      </div>
      <button type="button" className="ghost-button" onClick={() => void onSignOut()}>
        Sign out
      </button>
    </div>
  );
}
