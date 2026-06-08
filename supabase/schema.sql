-- Glydus CRM production schema
-- Run this in the Supabase SQL editor (or it is applied automatically by v0).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / drop-and-recreate policies.

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------
create table if not exists public.crm_users (
  id           text primary key,
  auth_user_id uuid unique,
  full_name    text not null,
  email        text not null,
  login_id     text not null unique,
  password     text,
  role         text not null default 'Sales Executive',
  department   text,
  status       text not null default 'Active',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.leads (
  id              text primary key,
  company_name    text,
  contact_name    text,
  email           text,
  phone           text,
  source          text,
  stage           text,
  priority        text,
  estimated_value numeric,
  probability     numeric,
  owner_id        text,
  next_action     text,
  follow_up_date  date,
  last_note       text,
  created_by      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.activities (
  id                   text primary key,
  lead_id              text,
  lead_name            text,
  user_id              text,
  action               text,
  minutes              numeric,
  note                 text,
  changes              text,
  outcome              text,
  sentiment            text,
  priority             text,
  next_follow_up_date  date,
  deliverable          text,
  needs_support        boolean default false,
  activity_date        date,
  created_at           timestamptz not null default now()
);

create index if not exists leads_owner_id_idx on public.leads (owner_id);
create index if not exists activities_user_id_idx on public.activities (user_id);
create index if not exists activities_lead_id_idx on public.activities (lead_id);
create index if not exists crm_users_login_id_idx on public.crm_users (lower(login_id));

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.crm_users enable row level security;
alter table public.leads enable row level security;
alter table public.activities enable row level security;

-- crm_users: any signed-in user can read profiles (the app filters per role
-- client-side). Inserts/updates/deletes are performed by the service role API,
-- which bypasses RLS, so no write policies are required here.
drop policy if exists "crm_users_select_authenticated" on public.crm_users;
create policy "crm_users_select_authenticated"
  on public.crm_users for select
  to authenticated
  using (true);

-- leads: signed-in users may read and write shared pipeline data.
drop policy if exists "leads_select_authenticated" on public.leads;
create policy "leads_select_authenticated"
  on public.leads for select to authenticated using (true);

drop policy if exists "leads_insert_authenticated" on public.leads;
create policy "leads_insert_authenticated"
  on public.leads for insert to authenticated with check (true);

drop policy if exists "leads_update_authenticated" on public.leads;
create policy "leads_update_authenticated"
  on public.leads for update to authenticated using (true) with check (true);

drop policy if exists "leads_delete_authenticated" on public.leads;
create policy "leads_delete_authenticated"
  on public.leads for delete to authenticated using (true);

-- activities: signed-in users may read and append the audit trail.
drop policy if exists "activities_select_authenticated" on public.activities;
create policy "activities_select_authenticated"
  on public.activities for select to authenticated using (true);

drop policy if exists "activities_insert_authenticated" on public.activities;
create policy "activities_insert_authenticated"
  on public.activities for insert to authenticated with check (true);

drop policy if exists "activities_update_authenticated" on public.activities;
create policy "activities_update_authenticated"
  on public.activities for update to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
-- Login resolution RPC
-- Maps a CRM Login ID to its email so users can sign in with a Login ID.
-- SECURITY DEFINER so it can run before the user is authenticated.
-- ----------------------------------------------------------------------------
create or replace function public.resolve_crm_login(requested_login_id text)
returns text
language sql
security definer
set search_path = public
as $$
  select email
  from public.crm_users
  where lower(login_id) = lower(requested_login_id)
    and status = 'Active'
  limit 1;
$$;

revoke all on function public.resolve_crm_login(text) from public;
grant execute on function public.resolve_crm_login(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Realtime: broadcast row changes to subscribed clients
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end
$$;

alter publication supabase_realtime add table public.crm_users;
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.activities;

alter table public.crm_users replica identity full;
alter table public.leads replica identity full;
alter table public.activities replica identity full;
