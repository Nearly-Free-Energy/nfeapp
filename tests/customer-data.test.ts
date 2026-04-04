import { describe, expect, it, vi } from 'vitest';
import { fetchAuthorizedCustomer, normalizeEmail, upsertCustomerAccess } from '../server/customer-data';
import { legacyCustomerMap } from '../server/legacy-customer-map';

function createFakeClient() {
  const profileRows = [
    {
      id: 'profile-1',
      email: 'customer@example.com',
      display_name: 'Customer Demo Profile',
      status: 'active',
    },
  ];
  const accountRows = [
    {
      id: 'account-1',
      customer_profile_id: 'profile-1',
      account_number: 'customer-demo',
      display_name: 'Customer Demo Account',
      status: 'active',
    },
  ];
  let serviceRows = [
    {
      id: 'service-1',
      utility_account_id: 'account-1',
      service_type: 'electric',
      service_name: 'Customer Demo Account Electric Service',
      service_address: null,
      status: 'active',
    },
  ];

  return {
    from(table: string) {
      return {
        select() {
          return this;
        },
        eq(field: string, value: string) {
          (this as { _filters?: Record<string, string> })._filters ??= {};
          (this as { _filters: Record<string, string> })._filters[field] = value;
          return this;
        },
        order() {
          if (table === 'utility_services') {
            return Promise.resolve({
              data: serviceRows.filter((row) => row.utility_account_id === (this._filters ?? {}).utility_account_id),
              error: null,
            });
          }
          return this;
        },
        limit() {
          return this;
        },
        maybeSingle: vi.fn(async function () {
          const filters = (this as { _filters?: Record<string, string> })._filters ?? {};
          if (table === 'customer_profiles') {
            return { data: profileRows.find((row) => row.email === filters.email) ?? null, error: null };
          }
          if (table === 'utility_accounts') {
            return {
              data: accountRows.find((row) => row.customer_profile_id === filters.customer_profile_id) ?? null,
              error: null,
            };
          }
          return { data: null, error: null };
        }),
        upsert: vi.fn((payload: unknown) => {
          if (table === 'customer_profiles') {
            const record = payload as { email: string; display_name: string; status: string };
            const existing = profileRows.find((row) => row.email === record.email);
            if (existing) {
              existing.display_name = record.display_name;
              existing.status = record.status;
            } else {
              profileRows.push({
                id: `profile-${profileRows.length + 1}`,
                email: record.email,
                display_name: record.display_name,
                status: record.status,
              });
            }
            return {
              select: async () => ({
                  data: [profileRows.find((row) => row.email === record.email)!],
                  error: null,
                }),
            };
          }

          if (table === 'utility_accounts') {
            const record = payload as {
              customer_profile_id: string;
              account_number: string;
              display_name: string;
              status: string;
            };
            const existing = accountRows.find((row) => row.account_number === record.account_number);
            if (existing) {
              existing.display_name = record.display_name;
              existing.status = record.status;
            } else {
              accountRows.push({
                id: `account-${accountRows.length + 1}`,
                customer_profile_id: record.customer_profile_id,
                account_number: record.account_number,
                display_name: record.display_name,
                status: record.status,
              });
            }

            return {
              select: async () => ({
                  data: [accountRows.find((row) => row.account_number === record.account_number)!],
                  error: null,
                }),
            };
          }

          const records = payload as Array<{
            utility_account_id: string;
            service_type: string;
            service_name: string;
            service_address: string | null;
            status: string;
          }>;

          for (const record of records) {
            const existing = serviceRows.find(
              (row) =>
                row.utility_account_id === record.utility_account_id &&
                row.service_type === record.service_type &&
                row.service_name === record.service_name,
            );

            if (existing) {
              existing.service_address = record.service_address;
              existing.status = record.status;
            } else {
              serviceRows.push({
                id: `service-${serviceRows.length + 1}`,
                utility_account_id: record.utility_account_id,
                service_type: record.service_type,
                service_name: record.service_name,
                service_address: record.service_address,
                status: record.status,
              });
            }
          }

          return {
            select: async () => ({
                data: records.map((record, index) => ({
                  id: `service-upsert-${index + 1}`,
                  utility_account_id: record.utility_account_id,
                  service_type: record.service_type,
                  service_name: record.service_name,
                  service_address: record.service_address,
                  status: record.status,
                })),
                error: null,
              }),
          };
        }),
        delete() {
          return {
            eq: async (_field: string, value: string) => {
              serviceRows = serviceRows.filter((row) => row.utility_account_id !== value);
              return { error: null };
            },
          };
        },
      };
    },
  };
}

describe('customer data helpers', () => {
  it('normalizes email addresses', () => {
    expect(normalizeEmail('  CUSTOMER@Example.com ')).toBe('customer@example.com');
  });

  it('loads an authorized customer bundle with services', async () => {
    const client = createFakeClient();
    const result = await fetchAuthorizedCustomer('customer@example.com', client as never);

    expect(result).toMatchObject({
      email: 'customer@example.com',
      account: {
        accountNumber: 'customer-demo',
      },
      services: [
        {
          serviceType: 'electric',
        },
      ],
    });
  });

  it('upserts customer access without creating duplicate profiles', async () => {
    const client = createFakeClient();

    const result = await upsertCustomerAccess(
      {
        email: 'customer@example.com',
        profileDisplayName: 'Customer Demo Profile Updated',
        accountNumber: 'customer-demo',
        accountDisplayName: 'Customer Demo Account',
        services: [
          {
            serviceType: 'electric',
            serviceName: 'Customer Demo Account Electric Service',
            serviceAddress: '123 Main St',
          },
        ],
      },
      {},
      client as never,
    );

    expect(result.profile.displayName).toBe('Customer Demo Profile Updated');
    expect(result.services).toHaveLength(1);
    expect(result.services[0].serviceAddress).toBe('123 Main St');
  });

  it('keeps the legacy migration source available for one-time import', () => {
    expect(legacyCustomerMap).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: 'customer@example.com',
          customerId: 'customer-demo',
        }),
      ]),
    );
  });
});
