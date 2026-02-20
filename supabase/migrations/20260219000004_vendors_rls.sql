-- Enable Row Level Security (RLS) on vendors so Supabase linter is satisfied.
-- Policies allow read for anon/authenticated and full CRUD for MVP/demo.
-- Tighten to authenticated-only for INSERT/UPDATE/DELETE when you add auth.
-- Safe to re-run: drops existing policies first.

alter table public.vendors enable row level security;

drop policy if exists "vendors_select" on public.vendors;
create policy "vendors_select"
  on public.vendors
  for select
  to public
  using (true);

drop policy if exists "vendors_insert" on public.vendors;
create policy "vendors_insert"
  on public.vendors
  for insert
  to public
  with check (true);

drop policy if exists "vendors_update" on public.vendors;
create policy "vendors_update"
  on public.vendors
  for update
  to public
  using (true)
  with check (true);

drop policy if exists "vendors_delete" on public.vendors;
create policy "vendors_delete"
  on public.vendors
  for delete
  to public
  using (true);
