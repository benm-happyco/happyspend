import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_METRICS_URL
const key = process.env.VITE_METRICS_ANON_KEY

if (!url || !key) {
  console.error('Missing VITE_METRICS_URL / VITE_METRICS_ANON_KEY (load from .env.local)')
  process.exit(1)
}

const supabase = createClient(url, key)

const propertyId = process.argv[2]
const startDate = process.argv[3]
const endDate = process.argv[4]

if (!propertyId || !startDate || !endDate) {
  console.error('Usage: node scripts/debug-metrics-property.mjs <propertyId> <startDate YYYY-MM-DD> <endDate YYYY-MM-DD>')
  process.exit(1)
}

const tables = [
  {
    name: 'occupancy_snapshots',
    dateCol: 'snapshot_date',
    select: 'property_id,snapshot_date,occupied_units,vacant_units,leased_units',
  },
  {
    name: 'rent_snapshots',
    dateCol: 'snapshot_date',
    select: 'property_id,snapshot_date,avg_effective_rent,avg_asking_rent,concessions_per_unit',
  },
  { name: 'resident_ratings', dateCol: 'rating_month', select: 'property_id,rating_month,rating_value' },
  { name: 'work_orders', dateCol: 'created_on', select: 'property_id,created_on,completed_on,material_cost_usd' },
]

for (const t of tables) {
  const { count, error } = await supabase
    .from(t.name)
    .select('property_id', { count: 'estimated', head: true })
    .eq('property_id', propertyId)
    .gte(t.dateCol, startDate)
    .lte(t.dateCol, endDate)

  console.log(`\n## ${t.name}`)
  if (error) {
    console.log('count error:', error.message)
  } else {
    console.log('estimated count:', count)
  }

  const sample = await supabase
    .from(t.name)
    .select(t.select)
    .eq('property_id', propertyId)
    .gte(t.dateCol, startDate)
    .lte(t.dateCol, endDate)
    .order(t.dateCol, { ascending: false })
    .limit(5)

  if (sample.error) {
    console.log('sample error:', sample.error.message)
  } else {
    console.log('sample rows:', sample.data)
  }
}

