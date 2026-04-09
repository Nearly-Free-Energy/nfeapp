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
  const meterSourceRows = [];
  const serviceMicrogridRows = [
    {
      utility_service_id: 'service-1',
      microgrid_id: 'microgrid-1',
    },
  ];
  const microgridRows = [
    {
      id: 'microgrid-1',
      microgrid_code: 'demo-microgrid',
      display_name: 'Demo Microgrid',
      status: 'active',
      timezone: 'Africa/Kampala',
    },
  ];
  const gatewayRows = [
    {
      id: 'gateway-1',
      microgrid_id: 'microgrid-1',
      gateway_slug: 'gw-aaron',
      display_name: 'Aaron Test Gateway',
      status: 'active',
    },
  ];
  const fieldDeviceRows = [
    {
      id: 'device-1',
      gateway_id: 'gateway-1',
      device_slug: 'meter-main',
      device_type: 'single-phase-smart-meter',
      vendor_model: 'Chint DDSU666',
      status: 'active',
    },
  ];

  const client = {
    from(table: string) {
      return {
        select() {
          return this;
        },
        in(field, values) {
          this._inFilter = { field, values };
          if (table === 'utility_service_microgrids') {
            return Promise.resolve({
              data: serviceMicrogridRows.filter((row) => values.includes(row[field])),
              error: null,
            });
          }
          if (table === 'microgrids') {
            return Promise.resolve({
              data: microgridRows.filter((row) => values.includes(row[field])),
              error: null,
            });
          }
          if (table === 'gateways') {
            return Promise.resolve({
              data: gatewayRows.filter((row) => values.includes(row[field])),
              error: null,
            });
          }
          if (table === 'field_devices') {
            return Promise.resolve({
              data: fieldDeviceRows.filter((row) => values.includes(row[field])),
              error: null,
            });
          }
          return Promise.resolve({ data: [], error: null });
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

          if (table === 'meter_sources') {
            const records = payload as Array<{
              utility_service_id: string;
              meter_id: string;
              source_type: string;
              meter_name: string | null;
              timezone: string;
              status: string;
            }>;

            for (const record of records) {
              const existing = meterSourceRows.find((row) => row.utility_service_id === record.utility_service_id);
              if (existing) {
                existing.meter_id = record.meter_id;
                existing.source_type = record.source_type;
                existing.meter_name = record.meter_name;
                existing.timezone = record.timezone;
                existing.status = record.status;
              } else {
                meterSourceRows.push({
                  id: `meter-source-${meterSourceRows.length + 1}`,
                  utility_service_id: record.utility_service_id,
                  meter_id: record.meter_id,
                  source_type: record.source_type,
                  meter_name: record.meter_name,
                  timezone: record.timezone,
                  status: record.status,
                });
              }
            }

            return { error: null };
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

  return Object.assign(client, { meterSourceRows });
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
      microgrids: [
        {
          microgridCode: 'demo-microgrid',
          gateways: [
            {
              gatewaySlug: 'gw-aaron',
              devices: [
                {
                  vendorModel: 'Chint DDSU666',
                },
              ],
            },
          ],
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

  it('stores a meter source mapping when provided during onboarding', async () => {
    const client = createFakeClient();

    await upsertCustomerAccess(
      {
        email: 'customer@example.com',
        profileDisplayName: 'Customer Demo Profile Updated',
        accountNumber: 'customer-demo',
        accountDisplayName: 'Customer Demo Account',
        services: [
          {
            serviceType: 'electric',
            serviceName: 'Customer Demo Account Electric Service',
            meterSource: {
              meterId: 'meter-001',
              sourceType: 'nextcloud_csv',
              meterName: 'Main Three Phase',
              timezone: 'America/Chicago',
            },
          },
        ],
      },
      {},
      client as never,
    );

    expect(client.meterSourceRows).toEqual([
      expect.objectContaining({
        utility_service_id: 'service-upsert-1',
        meter_id: 'meter-001',
        source_type: 'nextcloud_csv',
        meter_name: 'Main Three Phase',
        timezone: 'America/Chicago',
        status: 'active',
      }),
    ]);
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
