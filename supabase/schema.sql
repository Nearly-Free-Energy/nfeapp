create extension if not exists pgcrypto;

create table if not exists customer_profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists utility_accounts (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references customer_profiles(id) on delete cascade,
  account_number text not null unique,
  display_name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists utility_services (
  id uuid primary key default gen_random_uuid(),
  utility_account_id uuid not null references utility_accounts(id) on delete cascade,
  service_type text not null,
  service_name text not null,
  service_address text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (utility_account_id, service_type, service_name)
);

create table if not exists microgrids (
  id uuid primary key default gen_random_uuid(),
  microgrid_code text not null unique,
  display_name text not null,
  status text not null default 'active',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists utility_service_microgrids (
  utility_service_id uuid not null references utility_services(id) on delete cascade,
  microgrid_id uuid not null references microgrids(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (utility_service_id, microgrid_id)
);

create table if not exists gateways (
  id uuid primary key default gen_random_uuid(),
  microgrid_id uuid not null references microgrids(id) on delete cascade,
  gateway_slug text not null unique,
  display_name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists field_devices (
  id uuid primary key default gen_random_uuid(),
  gateway_id uuid not null references gateways(id) on delete cascade,
  device_slug text not null,
  device_type text not null,
  vendor_model text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gateway_id, device_slug)
);

create table if not exists usage_daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  utility_service_id uuid not null references utility_services(id) on delete cascade,
  microgrid_id uuid references microgrids(id) on delete set null,
  usage_date date not null,
  usage_kwh numeric(12,3),
  source text not null default 'estimated',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (utility_service_id, usage_date)
);

create index if not exists idx_customer_profiles_email on customer_profiles(email);
create index if not exists idx_utility_accounts_profile on utility_accounts(customer_profile_id);
create index if not exists idx_utility_services_account on utility_services(utility_account_id);
create index if not exists idx_utility_service_microgrids_service on utility_service_microgrids(utility_service_id);
create index if not exists idx_utility_service_microgrids_microgrid on utility_service_microgrids(microgrid_id);
create index if not exists idx_gateways_microgrid on gateways(microgrid_id);
create index if not exists idx_field_devices_gateway on field_devices(gateway_id);
create index if not exists idx_usage_daily_snapshots_service_date on usage_daily_snapshots(utility_service_id, usage_date);
