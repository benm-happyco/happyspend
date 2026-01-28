import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const envPath = path.join(repoRoot, '.env.local')

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return
  const raw = fs.readFileSync(filePath, 'utf8')
  raw.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) return
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = value
    }
  })
}

loadEnvFile(envPath)

const url = process.env.VITE_METRICS_URL
const anonKey = process.env.VITE_METRICS_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Missing VITE_METRICS_URL or VITE_METRICS_ANON_KEY in .env.local')
}

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
})

const fetchSchemas = async () => {
  const { data, error } = await supabase.from('information_schema.schemata').select('schema_name')
  if (error) throw error
  return (data ?? []).map((row) => row.schema_name).sort()
}

const fetchTables = async () => {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_schema, table_name')
    .neq('table_schema', 'pg_catalog')
    .neq('table_schema', 'information_schema')

  if (error) throw error
  return data ?? []
}

const fetchColumns = async () => {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('table_schema, table_name, column_name, data_type, is_nullable, ordinal_position')
    .neq('table_schema', 'pg_catalog')
    .neq('table_schema', 'information_schema')
    .order('ordinal_position', { ascending: true })

  if (error) throw error
  return data ?? []
}

const sampleTable = async (schema, table) => {
  const { data, error } = await supabase.schema(schema).from(table).select('*').limit(1)
  if (error) {
    return { error: error.message }
  }
  return { data }
}

const main = async () => {
  try {
    const schemas = await fetchSchemas()
    const tables = await fetchTables()
    const columns = await fetchColumns()

    const byTable = new Map()
    for (const col of columns) {
      const key = `${col.table_schema}.${col.table_name}`
      if (!byTable.has(key)) byTable.set(key, [])
      byTable.get(key).push({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        position: col.ordinal_position,
      })
    }

    const summary = []
    for (const table of tables) {
      const key = `${table.table_schema}.${table.table_name}`
      const cols = byTable.get(key) ?? []
      const sample = await sampleTable(table.table_schema, table.table_name)
      summary.push({
        schema: table.table_schema,
        table: table.table_name,
        columns: cols,
        sample,
      })
    }

    console.log(
      JSON.stringify(
        {
          schemas,
          tableCount: tables.length,
          tables: summary,
        },
        null,
        2
      )
    )
  } catch (error) {
    console.error('Schema discovery failed:', error?.message ?? error)
    console.error(
      [
        'The metrics anon key may not have access to information_schema.',
        'If you want full schema discovery, either:',
        '- provide a service role key for local read-only use, or',
        '- create a read-only SQL view/function in public schema that exposes metadata.',
      ].join('\n')
    )
    process.exit(1)
  }
}

await main()
