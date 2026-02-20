-- Seed vendors for Happy Spend Vendor Master
-- Run after migrations/20260219000003_create_vendors.sql in Supabase SQL Editor

insert into public.vendors (name, trade, status, rating, compliance, city, mbe, wbe, ytd_spend)
values
  ('Universal Contractors Inc.', 'HVAC', 'Connected', 4.9, 'green', 'Phoenix, AZ', true, false, '$412K'),
  ('Summit HVAC', 'HVAC', 'Connected', 4.7, 'green', 'Tempe, AZ', false, false, '$285K'),
  ('Precision Climate Co.', 'HVAC', 'Connected', 4.2, 'yellow', 'Mesa, AZ', false, false, '$156K'),
  ('Greenway Landscaping', 'Landscaping', 'Connected', 4.8, 'green', 'Scottsdale, AZ', false, true, '$198K'),
  ('SafeGuard Electric', 'Electrical', 'Connected', 4.5, 'green', 'Phoenix, AZ', false, false, '$322K'),
  ('ProClean Janitorial', 'General', 'Available', 4.6, 'green', 'Chandler, AZ', false, false, null),
  ('Desert Plumbing Co.', 'Plumbing', 'Available', 4.3, 'yellow', 'Gilbert, AZ', false, false, null),
  ('Apex Roofing Systems', 'Roofing', 'Available', 4.1, 'red', 'Phoenix, AZ', false, false, null)
on conflict (name) do nothing;
