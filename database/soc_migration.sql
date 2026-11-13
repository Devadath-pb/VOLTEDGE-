-- Additive migration for ESP32 SOC telemetry.
-- Run this once in the Supabase SQL editor before deploying the SOC firmware.
alter table if exists public.telemetry
    add column if not exists soc double precision null;
