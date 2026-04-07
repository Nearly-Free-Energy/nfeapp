import { createServerSupabaseClient } from './supabase-admin.js';

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function normalizeOptionalText(value) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeServiceInput(service) {
  return {
    serviceType: service.serviceType,
    serviceName: service.serviceName.trim(),
    serviceAddress: normalizeOptionalText(service.serviceAddress),
    status: service.status ?? 'active',
  };
}

export async function fetchAuthorizedCustomerContext(email, client = createServerSupabaseClient()) {
  const normalizedEmail = normalizeEmail(email);

  const { data: profile, error: profileError } = await client
    .from('customer_profiles')
    .select('id, email, display_name, status')
    .eq('email', normalizedEmail)
    .eq('status', 'active')
    .maybeSingle();

  if (profileError) {
    throw new Error(`Unable to load customer profile: ${profileError.message}`);
  }

  if (!profile) {
    return null;
  }

  const { data: account, error: accountError } = await client
    .from('utility_accounts')
    .select('id, customer_profile_id, account_number, display_name, status')
    .eq('customer_profile_id', profile.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (accountError) {
    throw new Error(`Unable to load utility account: ${accountError.message}`);
  }

  if (!account) {
    return null;
  }

  const { data: services, error: servicesError } = await client
    .from('utility_services')
    .select('id, utility_account_id, service_type, service_name, service_address, status')
    .eq('utility_account_id', account.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (servicesError) {
    throw new Error(`Unable to load utility services: ${servicesError.message}`);
  }

  const normalizedServices = toUtilityServices(services ?? []);
  const microgrids = await loadMicrogridTopology(normalizedServices, client);

  return {
    email: profile.email,
    profile: {
      id: profile.id,
      displayName: profile.display_name,
      status: profile.status,
    },
    account: {
      id: account.id,
      accountNumber: account.account_number,
      displayName: account.display_name,
      status: account.status,
    },
    services: normalizedServices,
    microgrids,
  };
}

export async function fetchAuthorizedCustomer(email, client = createServerSupabaseClient()) {
  const context = await fetchAuthorizedCustomerContext(email, client);
  if (!context) {
    return null;
  }

  return context;
}

export async function upsertCustomerAccess(input, options = {}, client = createServerSupabaseClient()) {
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedServices = input.services.map(normalizeServiceInput);

  if (normalizedServices.length === 0) {
    throw new Error('At least one utility service is required.');
  }

  const { data: profileRows, error: profileError } = await client
    .from('customer_profiles')
    .upsert(
      {
        email: normalizedEmail,
        display_name: input.profileDisplayName.trim(),
        status: input.profileStatus ?? 'active',
      },
      { onConflict: 'email' },
    )
    .select('id, email, display_name, status');

  if (profileError || !profileRows || profileRows.length === 0) {
    throw new Error(profileError?.message || 'Unable to upsert customer profile.');
  }

  const profile = profileRows[0];

  const { data: accountRows, error: accountError } = await client
    .from('utility_accounts')
    .upsert(
      {
        customer_profile_id: profile.id,
        account_number: input.accountNumber.trim(),
        display_name: input.accountDisplayName.trim(),
        status: input.accountStatus ?? 'active',
      },
      { onConflict: 'account_number' },
    )
    .select('id, customer_profile_id, account_number, display_name, status');

  if (accountError || !accountRows || accountRows.length === 0) {
    throw new Error(accountError?.message || 'Unable to upsert utility account.');
  }

  const account = accountRows[0];

  if (!options.appendServices) {
    const { error: deleteError } = await client.from('utility_services').delete().eq('utility_account_id', account.id);
    if (deleteError) {
      throw new Error(`Unable to replace utility services: ${deleteError.message}`);
    }
  }

  const { data: serviceRows, error: serviceError } = await client
    .from('utility_services')
    .upsert(
      normalizedServices.map((service) => ({
        utility_account_id: account.id,
        service_type: service.serviceType,
        service_name: service.serviceName,
        service_address: service.serviceAddress ?? null,
        status: service.status ?? 'active',
      })),
      { onConflict: 'utility_account_id,service_type,service_name' },
    )
    .select('id, utility_account_id, service_type, service_name, service_address, status');

  if (serviceError) {
    throw new Error(serviceError.message);
  }

  const finalServices = options.appendServices ? await loadServicesForAccount(account.id, client) : serviceRows ?? [];

  return {
    email: profile.email,
    profile: {
      id: profile.id,
      displayName: profile.display_name,
      status: profile.status,
    },
    account: {
      id: account.id,
      accountNumber: account.account_number,
      displayName: account.display_name,
      status: account.status,
    },
    services: toUtilityServices(finalServices),
    microgrids: [],
  };
}

async function loadMicrogridTopology(services, client) {
  const serviceIds = services.map((service) => service.id);
  if (serviceIds.length === 0) {
    return [];
  }

  const { data: serviceLinks, error: serviceLinksError } = await client
    .from('utility_service_microgrids')
    .select('utility_service_id, microgrid_id')
    .in('utility_service_id', serviceIds);

  if (serviceLinksError) {
    throw new Error(`Unable to load service microgrid links: ${serviceLinksError.message}`);
  }

  const microgridIds = [...new Set((serviceLinks ?? []).map((row) => row.microgrid_id))];
  if (microgridIds.length === 0) {
    return [];
  }

  const { data: microgridRows, error: microgridError } = await client
    .from('microgrids')
    .select('id, microgrid_code, display_name, status, timezone')
    .in('id', microgridIds);

  if (microgridError) {
    throw new Error(`Unable to load microgrids: ${microgridError.message}`);
  }

  const { data: gatewayRows, error: gatewayError } = await client
    .from('gateways')
    .select('id, microgrid_id, gateway_slug, display_name, status')
    .in('microgrid_id', microgridIds);

  if (gatewayError) {
    throw new Error(`Unable to load gateways: ${gatewayError.message}`);
  }

  const gatewayIds = [...new Set((gatewayRows ?? []).map((row) => row.id))];

  const { data: deviceRows, error: deviceError } =
    gatewayIds.length === 0
      ? { data: [], error: null }
      : await client
          .from('field_devices')
          .select('id, gateway_id, device_slug, device_type, vendor_model, status')
          .in('gateway_id', gatewayIds);

  if (deviceError) {
    throw new Error(`Unable to load field devices: ${deviceError.message}`);
  }

  return (microgridRows ?? [])
    .map((microgrid) => ({
      id: microgrid.id,
      microgridCode: microgrid.microgrid_code,
      displayName: microgrid.display_name,
      status: microgrid.status,
      timezone: microgrid.timezone,
      gateways: (gatewayRows ?? [])
        .filter((gateway) => gateway.microgrid_id === microgrid.id)
        .map((gateway) => ({
          id: gateway.id,
          gatewaySlug: gateway.gateway_slug,
          displayName: gateway.display_name,
          status: gateway.status,
          devices: (deviceRows ?? [])
            .filter((device) => device.gateway_id === gateway.id)
            .map((device) => ({
              id: device.id,
              deviceSlug: device.device_slug,
              deviceType: device.device_type,
              vendorModel: device.vendor_model,
              status: device.status,
            })),
        })),
    }))
    .sort((left, right) => left.displayName.localeCompare(right.displayName));
}

async function loadServicesForAccount(accountId, client) {
  const { data, error } = await client
    .from('utility_services')
    .select('id, utility_account_id, service_type, service_name, service_address, status')
    .eq('utility_account_id', accountId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Unable to load utility services: ${error.message}`);
  }

  return data ?? [];
}

function toUtilityServices(rows) {
  return rows.map((row) => ({
    id: row.id,
    serviceType: row.service_type,
    serviceName: row.service_name,
    serviceAddress: row.service_address,
    status: row.status,
  }));
}
