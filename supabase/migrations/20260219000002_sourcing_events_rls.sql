-- Enable Row Level Security (RLS) on sourcing_events so Supabase linter is satisfied.
-- Policies below allow read for anon/authenticated and full CRUD for anon (MVP/demo).
-- Tighten to authenticated-only for INSERT/UPDATE/DELETE when you add auth.

alter table public.sourcing_events enable row level security;

-- Allow read access to all (anon + authenticated) for listing and detail views
create policy "sourcing_events_select"
  on public.sourcing_events
  for select
  to public
  using (true);

-- Allow insert for anon/authenticated (MVP: create events from app)
create policy "sourcing_events_insert"
  on public.sourcing_events
  for insert
  to public
  with check (true);

-- Allow update for anon/authenticated (MVP: edit events)
create policy "sourcing_events_update"
  on public.sourcing_events
  for update
  to public
  using (true)
  with check (true);

-- Allow delete for anon/authenticated (MVP: delete events)
create policy "sourcing_events_delete"
  on public.sourcing_events
  for delete
  to public
  using (true);
