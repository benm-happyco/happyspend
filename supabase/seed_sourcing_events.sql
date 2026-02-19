-- Optional seed: 20 sample events from Happy Spend JSX prototype
-- Run after running supabase/migrations/20260219000001_create_sourcing_events.sql
-- in the Supabase SQL Editor. Uses external_id for display (e.g. SE-1001).

insert into public.sourcing_events (external_id, name, phase, status, project, property, bids, created_by, created_date, deadline, type, budget)
values
  ('SE-1001', 'HVAC Replacement — Units 1-40', 'Evaluation', 'Under Review', 'Capital Improvements Q1', 'Oakview Apartments', 4, 'Sarah Chen', '2026-01-28T09:15:00', '2026-02-15T17:00:00', 'RFQ', 180000),
  ('SE-1002', 'Lobby Renovation & Modernization', 'Market Engagement', 'Open', 'Tenant Experience 2026', 'Parkview Tower', 2, 'Sarah Chen', '2026-02-01T14:30:00', '2026-02-22T17:00:00', 'RFP', 450000),
  ('SE-1003', 'Smart Lock Vendor Discovery', 'Market Engagement', 'Open', 'Technology Upgrade', 'Portfolio-Wide', 5, 'James Park', '2026-02-03T10:00:00', '2026-02-28T17:00:00', 'RFI', 0),
  ('SE-1004', 'Parking Lot Resurfacing', 'Planning & Creation', 'Draft', 'Exterior Maintenance', 'Hilltop Commons', 0, 'Sarah Chen', '2026-02-08T11:45:00', null, 'RFQ', 95000),
  ('SE-1005', 'Pool Equipment Upgrade', 'Award & Contracting', 'Award Pending', 'Amenity Refresh', 'Sunset Gardens', 3, 'Maria Lopez', '2026-01-15T08:20:00', '2026-02-10T17:00:00', 'RFQ', 62000),
  ('SE-1006', 'Landscaping Services 2026', 'Award & Contracting', 'Awarded', 'Grounds Maintenance', 'Regional — Southeast', 6, 'James Park', '2025-12-10T13:00:00', '2026-01-20T17:00:00', 'RFP', 320000),
  ('SE-1007', 'Fire Alarm System Inspection', 'Market Engagement', 'Open', 'Safety Compliance', 'Metro Center Offices', 0, 'Sarah Chen', '2026-02-05T16:10:00', '2026-02-13T09:00:00', 'RFQ', 28000),
  ('SE-1008', 'EV Charging Station Providers', 'Evaluation', 'BAFO', 'Green Initiative', 'Corporate Portfolio', 7, 'James Park', '2026-01-20T09:00:00', '2026-02-12T17:00:00', 'RFI', 0),
  ('SE-1009', 'Elevator Modernization — Phase 1', 'Market Engagement', 'Amendment Draft', 'Capital Improvements Q1', 'Parkview Tower', 3, 'Sarah Chen', '2026-01-10T10:30:00', '2026-02-20T17:00:00', 'RFP', 750000),
  ('SE-1010', 'Exterior Paint — Building A-D', 'Planning & Creation', 'Pending Approval', 'Curb Appeal Program', 'Hilltop Commons', 0, 'Maria Lopez', '2026-02-07T14:00:00', '2026-03-01T17:00:00', 'RFQ', 175000),
  ('SE-1011', 'Janitorial Services — Portfolio', 'Conclusion', 'Completed', 'Recurring Services', 'Portfolio-Wide', 8, 'James Park', '2025-11-01T08:00:00', '2025-12-15T17:00:00', 'RFP', 540000),
  ('SE-1012', 'Roof Leak Emergency Repair', 'Award & Contracting', 'Contracting', 'Emergency Maintenance', 'Sunset Gardens', 2, 'Sarah Chen', '2026-02-01T07:30:00', '2026-02-05T17:00:00', 'RFQ', 45000),
  ('SE-1013', 'Plumbing Re-pipe — Building 3', 'Market Engagement', 'Paused', 'Capital Improvements Q1', 'Oakview Apartments', 1, 'Maria Lopez', '2026-01-22T11:15:00', '2026-02-18T17:00:00', 'RFQ', 210000),
  ('SE-1014', 'Security Camera Upgrade', 'Planning & Creation', 'Rejected', 'Safety Compliance', 'Metro Center Offices', 0, 'Sarah Chen', '2026-02-04T15:45:00', null, 'RFP', 120000),
  ('SE-1015', 'Window Replacement — South Wing', 'Planning & Creation', 'Scheduled', 'Energy Efficiency', 'Parkview Tower', 0, 'James Park', '2026-02-09T09:30:00', '2026-03-10T17:00:00', 'RFQ', 280000),
  ('SE-1016', 'Pest Control Annual Contract', 'Market Engagement', 'Open', 'Recurring Services', 'Regional — Southwest', 4, 'Maria Lopez', '2026-02-06T10:00:00', '2026-02-25T17:00:00', 'RFQ', 36000),
  ('SE-1017', 'Fitness Center Equipment RFI', 'Evaluation', 'Shortlisting', 'Amenity Refresh', 'Hilltop Commons', 9, 'James Park', '2026-01-18T13:45:00', '2026-02-08T17:00:00', 'RFI', 0),
  ('SE-1018', 'Emergency Generator Service', 'Conclusion', 'Cancelled', 'Safety Compliance', 'Sunset Gardens', 0, 'Sarah Chen', '2026-01-25T16:00:00', null, 'RFQ', 55000),
  ('SE-1019', 'Waterproofing — Parking Deck', 'Market Engagement', 'Retracted', 'Capital Improvements Q1', 'Metro Center Offices', 2, 'Maria Lopez', '2026-01-30T08:30:00', '2026-02-14T17:00:00', 'RFQ', 190000),
  ('SE-1020', 'Clubhouse AV System Install', 'Award & Contracting', 'Awarded', 'Amenity Refresh', 'Oakview Apartments', 3, 'James Park', '2026-01-12T12:00:00', '2026-02-01T17:00:00', 'RFQ', 85000)
on conflict (external_id) do nothing;
