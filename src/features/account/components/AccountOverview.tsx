import type { CustomerProfile, UtilityAccount, UtilityService } from '../../../models/customer';

type AccountOverviewProps = {
  profile: CustomerProfile;
  account: UtilityAccount;
  services: UtilityService[];
};

export function AccountOverview({ profile, account, services }: AccountOverviewProps) {
  return (
    <section className="account-overview" aria-label="Account overview">
      <div className="account-overview__grid">
        <article className="account-panel">
          <span className="account-panel__label">Profile</span>
          <strong className="account-panel__value">{profile.displayName}</strong>
          <span className="account-panel__meta">Status: {profile.status}</span>
        </article>

        <article className="account-panel">
          <span className="account-panel__label">Utility account</span>
          <strong className="account-panel__value">{account.displayName}</strong>
          <span className="account-panel__meta">Account #{account.accountNumber}</span>
        </article>
      </div>

      <section className="service-list" aria-label="Connected services">
        <div className="service-list__header">
          <h2>Services</h2>
          <p>These services are now coming from the customer account model instead of a hardcoded repo map.</p>
        </div>

        <div className="service-list__items">
          {services.map((service) => (
            <article key={service.id} className="service-card">
              <span className="service-card__type">{service.serviceType}</span>
              <strong className="service-card__name">{service.serviceName}</strong>
              <span className="service-card__meta">{service.serviceAddress ?? 'Address not yet provided'}</span>
              <span className="service-card__status">Status: {service.status}</span>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
