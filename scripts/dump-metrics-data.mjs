#!/usr/bin/env node
/**
 * Dump all data from the metrics Supabase database to JSON files.
 *
 * Requires VITE_METRICS_URL and VITE_METRICS_ANON_KEY in .env.local.
 * Output: scripts/dump/<table>.json (one file per table).
 *
 * Usage: node scripts/dump-metrics-data.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const envPath = path.join(repoRoot, '.env.local')
const dumpDir = path.join(__dirname, 'dump')

const PAGE_SIZE = 1000

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
  console.error('Missing VITE_METRICS_URL or VITE_METRICS_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, anonKey, { auth: { persistSession: false } })

/** Tables known from app usage (metrics DB). Add/remove if your DB differs. */
const TABLES = [
  'properties',
  'property_periods',
  'owner_groups',
  'management_companies',
  'work_orders',
  'capital_projects',
  'resident_ratings',
  'property_condition_scores',
  'households',
  'residents',
  'rent_snapshots',
  'occupancy_snapshots',
  'photos',
  'inspections',
  'make_ready_turns',
  'due_diligence_events',
]

async function fetchAll(table) {
  const rows = []
  let offset = 0
  let hasMore = true
  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(offset, offset + PAGE_SIZE - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    const chunk = data ?? []
    rows.push(...chunk)
    hasMore = chunk.length === PAGE_SIZE
    offset += PAGE_SIZE
  }
  return rows
}

async function main() {
  if (!fs.existsSync(dumpDir)) {
    fs.mkdirSync(dumpDir, { recursive: true })
  }

  const summary = {}

  for (const table of TABLES) {
    try {
      const rows = await fetchAll(table)
      const outPath = path.join(dumpDir, `${table}.json`)
      fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), 'utf8')
      summary[table] = { rows: rows.length, path: outPath }
      console.log(`${table}: ${rows.length} rows → ${outPath}`)
    } catch (err) {
      summary[table] = { error: err.message }
      console.error(`${table}: ${err.message}`)
    }
  }

  const summaryPath = path.join(dumpDir, '_summary.json')
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8')
  console.log(`\nSummary written to ${summaryPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
