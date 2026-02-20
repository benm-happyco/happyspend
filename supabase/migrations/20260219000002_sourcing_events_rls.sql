-- Enable Row Level Security (RLS) on sourcing_events so Supabase linter is satisfied.
-- Policies below allow read for anon/authenticated and full CRUD for anon (MVP/demo).
-- Tighten to authenticated-only for INSERT/UPDATE/DELETE when you add auth.
-- Safe to re-run: drops existing policies first.

alter table public.sourcing_events enable row level security;

drop policy if exists "sourcing_events_select" on public.sourcing_events;
create policy "sourcing_events_select"
  on public.sourcing_events
  for select
  to public
  using (true);

drop policy if exists "sourcing_events_insert" on public.sourcing_events;
create policy "sourcing_events_insert"
  on public.sourcing_events
  for insert
  to public
  with check (true);

drop policy if exists "sourcing_events_update" on public.sourcing_events;
create policy "sourcing_events_update"
  on public.sourcing_events
  for update
  to public
  using (true)
  with check (true);

drop policy if exists "sourcing_events_delete" on public.sourcing_events;
create policy "sourcing_events_delete"
  on public.sourcing_events
  for delete
  to public
  using (true);
