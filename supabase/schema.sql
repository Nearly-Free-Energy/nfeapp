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

create index if not exists idx_customer_profiles_email on customer_profiles(email);
create index if not exists idx_utility_accounts_profile on utility_accounts(customer_profile_id);
create index if not exists idx_utility_services_account on utility_services(utility_account_id);
