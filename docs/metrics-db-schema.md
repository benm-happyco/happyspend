# Metrics Supabase Database Schema

This document describes the **metrics** Supabase database used by the demo dashboard and HpmDashboard. It is inferred from app usage (`.from('table').select(...)`). The actual DB may have additional columns or tables.

**Connection:** `VITE_METRICS_URL` + `VITE_METRICS_ANON_KEY` (see `src/lib/supabaseMetrics.ts`).

---

## Tables and Columns

### `properties`
Core property records.

| Column         | Type / notes |
|----------------|--------------|
| `property_id`  | PK, used in selects |
| `name`         | Display name |
| `market`       | Optional |
| `unit_count`   | Number |
| `year_built`   | Optional |
| `street`       | Address |
| `city`         | Address |
| `state`        | Address |
| `postal_code`  | Address |

---

### `property_periods`
Ownership/management periods per property.

| Column                  | Type / notes |
|-------------------------|--------------|
| `property_id`           | FK → properties |
| `start_date`            | Date (YYYY-MM-DD) |
| `end_date`              | Date, nullable |
| `owner_group_id`        | FK → owner_groups |
| `management_company_id` | FK → management_companies |
| `acquisition_type`      | Optional (e.g. Acquisition) |
| `exit_type`             | Optional (e.g. Current) |

---

### `owner_groups`
Lookup for owner group names.

| Column           | Type / notes |
|------------------|--------------|
| `owner_group_id` | PK |
| `name`           | Display name |

---

### `management_companies`
Lookup for management company names.

| Column                  | Type / notes |
|-------------------------|--------------|
| `management_company_id` | PK |
| `name`                  | Display name |

---

### `work_orders`
Maintenance/work order records.

| Column             | Type / notes |
|--------------------|--------------|
| `property_id`      | FK → properties |
| `work_order_id`    | PK / identifier |
| `created_on`       | Date/time |
| `completed_on`     | Date/time, nullable |
| `category`         | Text (e.g. category name) |
| `priority`         | Text (e.g. emergency, urgent) |
| `status`           | Text (e.g. Open, Completed) |
| `unit_label`       | Unit identifier |
| `material_cost_usd`| Number, optional |
| `labor_minutes`    | Number, optional |

---

### `capital_projects`
Capital project / capex records.

| Column               | Type / notes |
|----------------------|--------------|
| `property_id`        | FK → properties |
| `capital_project_id` | PK |
| `project_type`       | Text (e.g. Renovation) |
| `vendor_name`        | Text, optional |
| `started_on`         | Date |
| `completed_on`       | Date, optional |
| `budget_usd`         | Number |
| `actual_usd`         | Number, optional |
| `units_impacted`     | Number, optional |

---

### `resident_ratings`
Resident satisfaction / survey scores.

| Column         | Type / notes |
|----------------|--------------|
| `property_id`  | FK → properties |
| `rating_month` | Date (e.g. YYYY-MM-01) |
| `rating_value` | Numeric score |
| `source`       | Optional |
| `response_count` | Optional |

---

### `property_condition_scores`
Property condition scores over time.

| Column        | Type / notes |
|---------------|--------------|
| `property_id` | FK → properties |
| `score_date`  | Date |
| `score_value` | Numeric score |
| `score_type`  | Text (e.g. Overall) |

---

### `households`
Household records per property.

| Column         | Type / notes |
|----------------|--------------|
| `property_id`  | FK → properties |
| `household_id` | PK |
| `income_annual_usd` | Number, optional |

---

### `residents`
Resident records linked to households.

| Column         | Type / notes |
|----------------|--------------|
| `household_id` | FK → households |
| `industry`     | Text, optional |
| `employer`     | Text, optional |

---

### `rent_snapshots`
Rent metrics by snapshot date.

| Column               | Type / notes |
|----------------------|--------------|
| `property_id`        | FK → properties |
| `snapshot_date`      | Date |
| `avg_asking_rent`    | Number |
| `avg_effective_rent` | Number |
| `concessions_per_unit` | Number, optional |

---

### `occupancy_snapshots`
Occupancy counts by snapshot date.

| Column         | Type / notes |
|----------------|--------------|
| `property_id`  | FK → properties |
| `snapshot_date`| Date |
| `occupied_units` | Number |
| `vacant_units` | Number |
| `leased_units` | Number |

---

### `photos`
Photo metadata (used in HpmDashboard).

| Column        | Type / notes |
|---------------|--------------|
| `property_id` | FK → properties |
| `photo_id`    | PK |
| `captured_on` | Date/time |
| `location_area` | Optional |

---

### `inspections`
Inspection records (used in HpmDashboard).

| Column            | Type / notes |
|-------------------|--------------|
| `property_id`     | FK → properties |
| `inspection_date` | Date |
| `inspection_type` | Text |

---

### `make_ready_turns`
Turn / make-ready records (used in HpmDashboard).

| Column         | Type / notes |
|----------------|--------------|
| `property_id`  | FK → properties |
| `move_out_date`| Date |
| `ready_date`   | Date, optional |
| `cost_usd`     | Number, optional |

---

### `due_diligence_events`
Due diligence events (used in HpmDashboard).

| Column        | Type / notes |
|---------------|--------------|
| `property_id` | FK → properties |
| `dd_event_id` | PK |

---

## Getting the real schema

If the anon key has access to `information_schema`, you can run:

```bash
node scripts/metricsSchema.mjs
```

That prints schema + sample rows as JSON. If it fails (e.g. permission denied), the schema above is the one implied by the app.

## Data dump

To dump all table data to JSON files:

```bash
node scripts/dump-metrics-data.mjs
```

Output is written to `scripts/dump/` (one `.json` file per table). Requires `VITE_METRICS_URL` and `VITE_METRICS_ANON_KEY` in `.env.local`.
