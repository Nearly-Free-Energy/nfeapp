import type { MeApiResponse, OnboardingCustomerInput, OnboardingServiceInput, UtilityService } from '../src/models/customer';
import { createServerSupabaseClient } from './supabase-admin.ts';

type CustomerProfileRow = {
  id: string;
  email: string;
  display_name: string;
  status: string;
};

type UtilityAccountRow = {
  id: string;
  customer_profile_id: string;
  account_number: string;
  display_name: string;
  status: string;
};

type UtilityServiceRow = {
  id: string;
  utility_account_id: string;
  service_type: string;
  service_name: string;
  service_address: string | null;
  status: string;
};

type UpsertOptions = {
  appendServices?: boolean;
};

type CustomerDataClient = ReturnType<typeof createServerSupabaseClient>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeServiceInput(service: OnboardingServiceInput): OnboardingServiceInput {
  return {
    serviceType: service.serviceType,
    serviceName: service.serviceName.trim(),
    serviceAddress: normalizeOptionalText(service.serviceAddress),
    status: service.status ?? 'active',
  };
}

export async function fetchAuthorizedCustomer(email: string, client: CustomerDataClient = createServerSupabaseClient()) {
  const normalizedEmail = normalizeEmail(email);

  const { data: profile, error: profileError } = await client
    .from('customer_profiles')
    .select('id, email, display_name, status')
    .eq('email', normalizedEmail)
    .eq('status', 'active')
    .maybeSingle<CustomerProfileRow>();

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
    .maybeSingle<UtilityAccountRow>();

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
    .order('created_at', { ascending: true })
    .returns<UtilityServiceRow[]>();

  if (servicesError) {
    throw new Error(`Unable to load utility services: ${servicesError.message}`);
  }

  return toMeApiResponse(profile, account, services ?? []);
}

export async function upsertCustomerAccess(
  input: OnboardingCustomerInput,
  options: UpsertOptions = {},
  client: CustomerDataClient = createServerSupabaseClient(),
): Promise<MeApiResponse> {
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
    .select('id, email, display_name, status')
    .returns<CustomerProfileRow[]>();

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
    .select('id, customer_profile_id, account_number, display_name, status')
    .returns<UtilityAccountRow[]>();

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
    .select('id, utility_account_id, service_type, service_name, service_address, status')
    .returns<UtilityServiceRow[]>();

  if (serviceError) {
    throw new Error(serviceError.message);
  }

  const finalServices = options.appendServices ? await loadServicesForAccount(account.id, client) : serviceRows ?? [];

  return toMeApiResponse(profile, account, finalServices);
}

async function loadServicesForAccount(accountId: string, client: CustomerDataClient): Promise<UtilityServiceRow[]> {
  const { data, error } = await client
    .from('utility_services')
    .select('id, utility_account_id, service_type, service_name, service_address, status')
    .eq('utility_account_id', accountId)
    .order('created_at', { ascending: true })
    .returns<UtilityServiceRow[]>();

  if (error) {
    throw new Error(`Unable to load utility services: ${error.message}`);
  }

  return data ?? [];
}

function toUtilityServices(rows: UtilityServiceRow[]): UtilityService[] {
  return rows.map((row) => ({
    id: row.id,
    serviceType: row.service_type as UtilityService['serviceType'],
    serviceName: row.service_name,
    serviceAddress: row.service_address,
    status: row.status as UtilityService['status'],
  }));
}

function toMeApiResponse(profile: CustomerProfileRow, account: UtilityAccountRow, services: UtilityServiceRow[]): MeApiResponse {
  return {
    email: profile.email,
    profile: {
      id: profile.id,
      displayName: profile.display_name,
      status: profile.status as MeApiResponse['profile']['status'],
    },
    account: {
      id: account.id,
      accountNumber: account.account_number,
      displayName: account.display_name,
      status: account.status as MeApiResponse['account']['status'],
    },
    services: toUtilityServices(services),
  };
}
