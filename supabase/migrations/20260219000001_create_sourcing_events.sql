-- Happy Spend MVP: sourcing_events table
-- Run this in Supabase SQL Editor or via supabase db push

create table if not exists public.sourcing_events (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  phase text not null,
  status text not null,
  project text,
  property text,
  bids int4 not null default 0,
  created_by text,
  created_date timestamptz,
  deadline timestamptz,
  type text not null check (type in ('RFQ', 'RFP', 'RFI')),
  budget numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sourcing_events_phase on public.sourcing_events (phase);
create index if not exists idx_sourcing_events_status on public.sourcing_events (status);
create index if not exists idx_sourcing_events_deadline on public.sourcing_events (deadline);
create index if not exists idx_sourcing_events_external_id on public.sourcing_events (external_id);

comment on table public.sourcing_events is 'Happy Spend: sourcing/RFx events for MVP';
