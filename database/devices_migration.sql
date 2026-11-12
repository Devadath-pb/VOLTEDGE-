-- Apply once in the Supabase SQL editor after the existing tenant migration.
create table if not exists public.devices (
    device_id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    battery_id uuid not null unique references public.batteries(battery_id) on delete cascade,
    name varchar(100) not null,
    key_hash varchar(64) not null unique,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    last_seen_at timestamptz
);

create index if not exists devices_owner_id_idx on public.devices(owner_id);
alter table public.devices enable row level security;
alter table public.devices force row level security;

drop policy if exists devices_owner_select on public.devices;
create policy devices_owner_select on public.devices
    for select using (owner_id = auth.uid());

drop policy if exists devices_owner_insert on public.devices;
create policy devices_owner_insert on public.devices
    for insert with check (owner_id = auth.uid());

drop policy if exists devices_owner_update on public.devices;
create policy devices_owner_update on public.devices
    for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
