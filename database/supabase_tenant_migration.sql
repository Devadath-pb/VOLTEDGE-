-- VoltEdge Supabase schema with per-user tenant isolation.
-- The existing local rows will be imported separately and assigned to the
-- Supabase user UUID created for this project.

create extension if not exists pgcrypto;

do $$
begin
  create type public.monitoring_session_status as enum ('ACTIVE', 'COMPLETED');
exception when duplicate_object then null;
end $$;

create table if not exists public.batteries (
  battery_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  serial_number varchar(100) not null unique,
  manufacturer varchar(100), model varchar(100), chemistry varchar(50),
  rated_capacity_mah integer, nominal_voltage double precision,
  manufacture_date date, purchase_date date, installation_date date,
  status varchar(30) default 'Active',
  created_at timestamptz default now(), is_active boolean default false
);

create table if not exists public.battery_cycles (
  id uuid primary key default gen_random_uuid(),
  battery_id uuid not null references public.batteries(battery_id),
  cycle_number integer not null, status varchar(30) not null,
  started_at timestamptz not null default now(), completed_at timestamptz,
  estimated_capacity_mah double precision, estimated_soh double precision,
  running_capacity_mah double precision default 0 not null,
  charge_duration_seconds double precision default 0 not null,
  discharge_duration_seconds double precision default 0 not null,
  charge_energy_wh double precision default 0 not null,
  discharge_energy_wh double precision default 0 not null,
  charge_efficiency double precision,
  average_charge_temperature double precision, max_charge_temperature double precision,
  average_charge_voltage double precision, max_charge_voltage double precision,
  average_charge_current double precision, max_charge_current double precision,
  average_discharge_temperature double precision, max_discharge_temperature double precision,
  average_discharge_voltage double precision, max_discharge_voltage double precision,
  average_discharge_current double precision, max_discharge_current double precision,
  notes text, created_at timestamptz default now()
);

create table if not exists public.monitoring_sessions (
  id uuid primary key default gen_random_uuid(),
  battery_id uuid not null references public.batteries(battery_id),
  status public.monitoring_session_status not null default 'ACTIVE',
  test_status varchar(30) not null default 'ACTIVE',
  running_capacity_mah double precision default 0,
  estimated_capacity_mah double precision, estimated_soh double precision,
  start_time timestamptz not null default now(), end_time timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.telemetry (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.monitoring_sessions(id),
  battery_id uuid references public.batteries(battery_id),
  cycle_id uuid references public.battery_cycles(id),
  phase varchar(50), voltage double precision not null,
  current double precision not null, power double precision not null,
  energy_wh double precision, temperature double precision,
  mode varchar(50) not null, relay boolean not null,
  timestamp bigint not null, created_at timestamptz default now()
);

create index if not exists idx_batteries_owner_id on public.batteries(owner_id);
create index if not exists idx_cycles_battery_id on public.battery_cycles(battery_id);
create index if not exists idx_sessions_battery_id on public.monitoring_sessions(battery_id);
create index if not exists idx_telemetry_battery_id on public.telemetry(battery_id);
create index if not exists idx_telemetry_session_id on public.telemetry(session_id);
create index if not exists idx_telemetry_cycle_id on public.telemetry(cycle_id);

alter table public.batteries enable row level security;
alter table public.battery_cycles enable row level security;
alter table public.monitoring_sessions enable row level security;
alter table public.telemetry enable row level security;
alter table public.batteries force row level security;
alter table public.battery_cycles force row level security;
alter table public.monitoring_sessions force row level security;
alter table public.telemetry force row level security;

drop policy if exists batteries_owner on public.batteries;
create policy batteries_owner on public.batteries for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists cycles_owner on public.battery_cycles;
create policy cycles_owner on public.battery_cycles for all
  using (exists (select 1 from public.batteries b
                 where b.battery_id = battery_cycles.battery_id
                   and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.batteries b
                      where b.battery_id = battery_cycles.battery_id
                        and b.owner_id = auth.uid()));

drop policy if exists sessions_owner on public.monitoring_sessions;
create policy sessions_owner on public.monitoring_sessions for all
  using (exists (select 1 from public.batteries b
                 where b.battery_id = monitoring_sessions.battery_id
                   and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.batteries b
                      where b.battery_id = monitoring_sessions.battery_id
                        and b.owner_id = auth.uid()));

drop policy if exists telemetry_owner on public.telemetry;
create policy telemetry_owner on public.telemetry for all
  using (
    (battery_id is not null and exists (select 1 from public.batteries b
      where b.battery_id = telemetry.battery_id and b.owner_id = auth.uid()))
    or (session_id is not null and exists (select 1 from public.monitoring_sessions s
      join public.batteries b on b.battery_id = s.battery_id
      where s.id = telemetry.session_id and b.owner_id = auth.uid()))
    or (cycle_id is not null and exists (select 1 from public.battery_cycles c
      join public.batteries b on b.battery_id = c.battery_id
      where c.id = telemetry.cycle_id and b.owner_id = auth.uid()))
  )
  with check (
    (battery_id is not null and exists (select 1 from public.batteries b
      where b.battery_id = telemetry.battery_id and b.owner_id = auth.uid()))
    or (session_id is not null and exists (select 1 from public.monitoring_sessions s
      join public.batteries b on b.battery_id = s.battery_id
      where s.id = telemetry.session_id and b.owner_id = auth.uid()))
    or (cycle_id is not null and exists (select 1 from public.battery_cycles c
      join public.batteries b on b.battery_id = c.battery_id
      where c.id = telemetry.cycle_id and b.owner_id = auth.uid()))
  );
