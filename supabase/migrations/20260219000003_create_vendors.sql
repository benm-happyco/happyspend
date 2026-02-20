-- Happy Spend: vendors table (Vendor Master list)
-- Run in Supabase SQL Editor or via supabase db push

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trade text not null,
  status text not null default 'Available' check (status in ('Connected', 'Available')),
  rating numeric(3,2) default 0,
  compliance text not null default 'green' check (compliance in ('green', 'yellow', 'red')),
  city text,
  mbe boolean not null default false,
  wbe boolean not null default false,
  ytd_spend text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vendors_trade on public.vendors (trade);
create index if not exists idx_vendors_status on public.vendors (status);
create unique index if not exists idx_vendors_name_unique on public.vendors (name);
create index if not exists idx_vendors_name on public.vendors (name);

comment on table public.vendors is 'Happy Spend: Vendor Master list for sourcing';
