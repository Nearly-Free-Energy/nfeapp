-- Security hardening for customer-facing access paths.
-- Enables RLS across app tables and adds authenticated read policies for
-- the customer data a signed-in portal user should be able to see.

alter table public.customer_profiles enable row level security;
alter table public.utility_accounts enable row level security;
alter table public.utility_services enable row level security;
alter table public.microgrids enable row level security;
alter table public.utility_service_microgrids enable row level security;
alter table public.gateways enable row level security;
alter table public.field_devices enable row level security;
alter table public.meter_sources enable row level security;
alter table public.usage_import_files enable row level security;
alter table public.usage_daily_snapshots enable row level security;

create or replace function public.current_customer_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select cp.id
  from public.customer_profiles cp
  where cp.email = lower(coalesce(auth.jwt() ->> 'email', ''))
    and cp.status = 'active'
  limit 1
$$;

create or replace function public.customer_owns_utility_account(target_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.utility_accounts ua
    where ua.id = target_account_id
      and ua.customer_profile_id = public.current_customer_profile_id()
      and ua.status = 'active'
  )
$$;

create or replace function public.customer_owns_utility_service(target_service_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.utility_services us
    join public.utility_accounts ua on ua.id = us.utility_account_id
    where us.id = target_service_id
      and us.status = 'active'
      and ua.status = 'active'
      and ua.customer_profile_id = public.current_customer_profile_id()
  )
$$;

create or replace function public.customer_owns_microgrid(target_microgrid_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.microgrids mg
    join public.utility_service_microgrids usm on usm.microgrid_id = mg.id
    join public.utility_services us on us.id = usm.utility_service_id
    join public.utility_accounts ua on ua.id = us.utility_account_id
    where mg.id = target_microgrid_id
      and mg.status = 'active'
      and us.status = 'active'
      and ua.status = 'active'
      and ua.customer_profile_id = public.current_customer_profile_id()
  )
$$;

create or replace function public.customer_owns_gateway(target_gateway_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.gateways g
    where g.id = target_gateway_id
      and g.status = 'active'
      and public.customer_owns_microgrid(g.microgrid_id)
  )
$$;

revoke all on function public.current_customer_profile_id() from public;
revoke all on function public.customer_owns_utility_account(uuid) from public;
revoke all on function public.customer_owns_utility_service(uuid) from public;
revoke all on function public.customer_owns_microgrid(uuid) from public;
revoke all on function public.customer_owns_gateway(uuid) from public;

grant execute on function public.current_customer_profile_id() to authenticated;
grant execute on function public.customer_owns_utility_account(uuid) to authenticated;
grant execute on function public.customer_owns_utility_service(uuid) to authenticated;
grant execute on function public.customer_owns_microgrid(uuid) to authenticated;
grant execute on function public.customer_owns_gateway(uuid) to authenticated;

drop policy if exists customer_profiles_self_select on public.customer_profiles;
create policy customer_profiles_self_select
on public.customer_profiles
for select
to authenticated
using (id = public.current_customer_profile_id());

drop policy if exists utility_accounts_customer_select on public.utility_accounts;
create policy utility_accounts_customer_select
on public.utility_accounts
for select
to authenticated
using (
  status = 'active'
  and public.customer_owns_utility_account(id)
);

drop policy if exists utility_services_customer_select on public.utility_services;
create policy utility_services_customer_select
on public.utility_services
for select
to authenticated
using (
  status = 'active'
  and public.customer_owns_utility_service(id)
);

drop policy if exists usage_daily_snapshots_customer_select on public.usage_daily_snapshots;
create policy usage_daily_snapshots_customer_select
on public.usage_daily_snapshots
for select
to authenticated
using (public.customer_owns_utility_service(utility_service_id));

drop policy if exists utility_service_microgrids_customer_select on public.utility_service_microgrids;
create policy utility_service_microgrids_customer_select
on public.utility_service_microgrids
for select
to authenticated
using (public.customer_owns_utility_service(utility_service_id));

drop policy if exists microgrids_customer_select on public.microgrids;
create policy microgrids_customer_select
on public.microgrids
for select
to authenticated
using (
  status = 'active'
  and public.customer_owns_microgrid(id)
);

drop policy if exists gateways_customer_select on public.gateways;
create policy gateways_customer_select
on public.gateways
for select
to authenticated
using (
  status = 'active'
  and public.customer_owns_microgrid(microgrid_id)
);

drop policy if exists field_devices_customer_select on public.field_devices;
create policy field_devices_customer_select
on public.field_devices
for select
to authenticated
using (
  status = 'active'
  and public.customer_owns_gateway(gateway_id)
);
