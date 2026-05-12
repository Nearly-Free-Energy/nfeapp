import type { CustomerProfile, Microgrid, UtilityAccount, UtilityService } from '../../../models/customer';

type AccountOverviewProps = {
  profile: CustomerProfile;
  account: UtilityAccount;
  accounts: UtilityAccount[];
  services: UtilityService[];
  microgrids: Microgrid[];
};

export function AccountOverview({ profile, account, accounts, services, microgrids }: AccountOverviewProps) {
  return (
    <section className="account-overview" aria-label="Account overview">
      <div className="account-overview__grid">
        <article className="account-panel">
          <span className="account-panel__label">Profile</span>
          <strong className="account-panel__value">{profile.displayName}</strong>
          <span className="account-panel__meta">Status: {profile.status}</span>
        </article>

        <article className="account-panel">
          <span className="account-panel__label">Utility accounts</span>
          <strong className="account-panel__value">{accounts.length}</strong>
          <span className="account-panel__meta">Primary: {account.displayName} · Account #{account.accountNumber}</span>
        </article>
      </div>

      <section className="service-list" aria-label="Connected services">
        <div className="service-list__header">
          <h2>Services</h2>
          <p>These services are grouped by the utility accounts linked to this customer profile.</p>
        </div>

        <div className="service-list__items">
          {accounts.map((utilityAccount) => {
            const accountServices = services.filter((service) => service.utilityAccountId === utilityAccount.id);

            return (
              <article key={utilityAccount.id} className="service-card">
                <span className="service-card__type">utility account</span>
                <strong className="service-card__name">{utilityAccount.displayName}</strong>
                <span className="service-card__meta">Account #{utilityAccount.accountNumber} · Status: {utilityAccount.status}</span>
                <div className="service-card__meta">
                  {accountServices.length === 0
                    ? 'No active services linked.'
                    : accountServices.map((service) => (
                        <div key={service.id}>
                          <span>{service.serviceType}: </span>
                          <strong>{service.serviceName}</strong>
                          <span> · {service.serviceAddress ?? 'Address not yet provided'} · Status: {service.status}</span>
                        </div>
                      ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="service-list" aria-label="Microgrids and gateways">
        <div className="service-list__header">
          <h2>Microgrids and gateways</h2>
          <p>This is the emerging platform model that links customer services to microgrids, gateways, and field devices.</p>
        </div>

        <div className="service-list__items">
          {microgrids.length === 0 ? (
            <article className="service-card">
              <strong className="service-card__name">No microgrids linked yet</strong>
              <span className="service-card__meta">This customer account has not been mapped to a microgrid topology yet.</span>
            </article>
          ) : (
            microgrids.map((microgrid) => (
              <article key={microgrid.id} className="service-card">
                <span className="service-card__type">microgrid</span>
                <strong className="service-card__name">{microgrid.displayName}</strong>
                <span className="service-card__meta">
                  Code: {microgrid.microgridCode} · Timezone: {microgrid.timezone} · Status: {microgrid.status}
                </span>
                <div className="service-card__meta">
                  {microgrid.gateways.length === 0 ? (
                    'No gateways linked yet.'
                  ) : (
                    microgrid.gateways.map((gateway) => (
                      <div key={gateway.id}>
                        Gateway: {gateway.displayName} ({gateway.gatewaySlug}) · Status: {gateway.status}
                        {gateway.devices.length > 0 ? (
                          <div>
                            Devices: {gateway.devices.map((device) => `${device.vendorModel} [${device.deviceType}]`).join(', ')}
                          </div>
                        ) : (
                          <div>Devices: none linked yet.</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
