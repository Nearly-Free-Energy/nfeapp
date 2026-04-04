import { legacyCustomerMap } from '../server/legacy-customer-map.js';
import { upsertCustomerAccess } from '../server/customer-data.js';

async function main() {
  const migrated = [];

  for (const entry of legacyCustomerMap) {
    const result = await upsertCustomerAccess({
      email: entry.email,
      profileDisplayName: entry.customerName,
      accountNumber: entry.customerId,
      accountDisplayName: entry.customerName,
      services: [
        {
          serviceType: 'electric',
          serviceName: `${entry.customerName} Electric Service`,
          serviceAddress: null,
        },
      ],
    });

    migrated.push({
      email: result.email,
      profileId: result.profile.id,
      accountId: result.account.id,
      serviceCount: result.services.length,
    });
  }

  console.log(
    JSON.stringify(
      {
        message: 'Legacy customer map migration completed.',
        migrated,
      },
      null,
      2,
    ),
  );
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
