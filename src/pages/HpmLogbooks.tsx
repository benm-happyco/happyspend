import {
  Alert,
  Box,
  Button,
  Checkbox,
  Group,
  Select,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ColDef, ModuleRegistry } from 'ag-grid-community'
import { InlineEditorDrawer } from '../theme/components/HpyDrawer'
import { DateTimePicker } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../theme/components/GlobalHeader'
import { HpySidebar } from '../theme/components/HpySidebar'
import { HpyPageHeader } from '../theme/components/HpyPageHeader'
import { supabase } from '../lib/supabase'
import { AG_GRID_DEFAULT_COL_DEF, AG_GRID_DEFAULT_GRID_PROPS } from '../lib/agGridDefaults'
import '@mantine/dates/styles.css'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

ModuleRegistry.registerModules([AllCommunityModule])

type LogbookEntry = Record<string, any>

type TechnicianOption = {
  value: string
  label: string
  name: string
  userRef: string
}

export function HpmLogbooks() {
  const [propertyOptions, setPropertyOptions] = useState<{ value: string; label: string }[]>([])
  const [technicianOptions, setTechnicianOptions] = useState<TechnicianOption[]>([])
  const [entries, setEntries] = useState<LogbookEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [loadingDrawer, setLoadingDrawer] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpened, setDrawerOpened] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create')
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
  const [originalEntryType, setOriginalEntryType] = useState<'pool_chemistry' | 'hvac_refrigerant' | ''>('')
  const [formState, setFormState] = useState<Record<string, any>>({
    property_id: '',
    entry_type: 'pool_chemistry',
    performed_at: null,
    performed_by_name: '',
    performed_by_user_ref: '',
    location_label: '',
    notes: '',
    pool_name: '',
    water_temp_f: '',
    ph: '',
    free_chlorine_ppm: '',
    total_chlorine_ppm: '',
    alkalinity_ppm: '',
    calcium_hardness_ppm: '',
    cyanuric_acid_ppm: '',
    chemicals_added: '',
    requires_follow_up: false,
    follow_up_notes: '',
    equipment_label: '',
    equipment_location: '',
    manufacturer: '',
    model_number: '',
    serial_number: '',
    refrigerant_type: '',
    ambient_temp_f: '',
    suction_pressure_psi: '',
    discharge_pressure_psi: '',
    superheat_f: '',
    subcooling_f: '',
    leak_check_performed: false,
    leak_detected: false,
    leak_method: '',
    refrigerant_added_lbs: '',
    refrigerant_removed_lbs: '',
    refrigerant_recovered_lbs: '',
  })

  const dropdownZIndex = 5005
  const comboboxProps = { withinPortal: true, zIndex: dropdownZIndex }

  useEffect(() => {
    let isMounted = true

    const fetchFilters = async () => {
      try {
        const [propertiesResult, techniciansResult] = await Promise.all([
          supabase.from('properties').select('*').order('name'),
          supabase.from('technicians').select('*'),
        ])

        if (!isMounted) return

        if (propertiesResult.error) throw propertiesResult.error
        if (techniciansResult.error) throw techniciansResult.error

        const properties = propertiesResult.data ?? []
        const technicians = techniciansResult.data ?? []

        setPropertyOptions(
          properties.map((property) => ({
            value: property.property_id ?? property.id ?? property.propertyId ?? property.uuid,
            label: property.name ?? property.display_name ?? property.property_name ?? 'Unknown property',
          }))
        )

        setTechnicianOptions(
          technicians.map((tech) => ({
            value: tech.Email ?? tech.email ?? tech.id ?? tech.user_id ?? tech.uuid,
            label: tech.Name ?? tech.name ?? tech.display_name ?? tech.full_name ?? 'Technician',
            name: tech.Name ?? tech.name ?? tech.display_name ?? tech.full_name ?? 'Technician',
            userRef: tech.Email ?? tech.email ?? tech.id ?? tech.user_id ?? tech.uuid ?? '',
          }))
        )
      } catch (err) {
        if (!isMounted) return
        setError((err as Error).message || 'Unable to load filters from Supabase.')
      }
    }

    fetchFilters()

    return () => {
      isMounted = false
    }
  }, [])

  const refreshEntries = async () => {
    try {
      setLoadingEntries(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('logbook_entries_with_property')
        .select('*')
        .order('performed_at', { ascending: false })
      if (fetchError) throw fetchError
      setEntries(data ?? [])
    } catch (err) {
      setError((err as Error).message || 'Unable to load logbook entries.')
    } finally {
      setLoadingEntries(false)
    }
  }

  useEffect(() => {
    refreshEntries()
  }, [])

  useEffect(() => {
    if (!drawerOpened) return
    setLoadingDrawer(true)
    const timer = setTimeout(() => setLoadingDrawer(false), 250)
    return () => clearTimeout(timer)
  }, [drawerOpened])

  const formatDateTime = (value: string | null) => {
    if (!value) return { label: '—', full: '' }
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return { label: value, full: value }

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    const formatTime = (d: Date) =>
      d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
    const formatDate = (d: Date) =>
      d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const formatDateYear = (d: Date) =>
      d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    const weekday = date.toLocaleDateString(undefined, { weekday: 'long' })

    let label = ''
    if (diffSeconds < 5 && diffSeconds >= 0) {
      label = 'Just now'
    } else if (diffMinutes < 60 && diffMinutes >= 0) {
      label = `${diffMinutes} min ago`
    } else if (diffHours < 24 && diffHours >= 0) {
      label = `${diffHours} hr ago`
    } else if (diffDays === 1) {
      label = `Yesterday at ${formatTime(date)}`
    } else if (diffDays <= 7 && diffDays > 0) {
      label = `${weekday} at ${formatTime(date)}`
    } else if (diffMs < 0) {
      const futureMinutes = Math.abs(diffMinutes)
      const futureHours = Math.abs(diffHours)
      const futureDays = Math.abs(diffDays)

      if (futureMinutes < 60) {
        label = `in ${futureMinutes} min`
      } else if (futureHours < 24) {
        label = `in ${futureHours} hours`
      } else if (futureDays === 1) {
        label = `Tomorrow at ${formatTime(date)}`
      } else if (futureDays <= 7) {
        label = `${weekday} at ${formatTime(date)}`
      } else {
        label = formatDateYear(date)
      }
    } else if (date.getFullYear() === now.getFullYear()) {
      label = formatDate(date)
    } else {
      label = formatDateYear(date)
    }

    const full = `${date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })} at ${formatTime(date)}`
    return { label, full }
  }

  const resetForm = () => {
    setFormState({
      property_id: '',
      entry_type: 'pool_chemistry',
      performed_at: null,
      performed_by_name: '',
      performed_by_user_ref: '',
      location_label: '',
      notes: '',
      pool_name: '',
      water_temp_f: '',
      ph: '',
      free_chlorine_ppm: '',
      total_chlorine_ppm: '',
      alkalinity_ppm: '',
      calcium_hardness_ppm: '',
      cyanuric_acid_ppm: '',
      chemicals_added: '',
      requires_follow_up: false,
      follow_up_notes: '',
      equipment_label: '',
      equipment_location: '',
      manufacturer: '',
      model_number: '',
      serial_number: '',
      refrigerant_type: '',
      ambient_temp_f: '',
      suction_pressure_psi: '',
      discharge_pressure_psi: '',
      superheat_f: '',
      subcooling_f: '',
      leak_check_performed: false,
      leak_detected: false,
      leak_method: '',
      refrigerant_added_lbs: '',
      refrigerant_removed_lbs: '',
      refrigerant_recovered_lbs: '',
    })
    setOriginalEntryType('')
    setActiveEntryId(null)
  }

  const openCreate = () => {
    setDrawerMode('create')
    resetForm()
    setDrawerOpened(true)
  }

  const openEdit = async (entry: LogbookEntry) => {
    const entryId = entry.id ?? entry.logbook_entry_id ?? entry.entry_id ?? ''
    setDrawerMode('edit')
    setActiveEntryId(entryId)
    const entryType = entry.entry_type ?? ''
    setOriginalEntryType(entryType)
    setFormState((prev) => ({
      ...prev,
      property_id: entry.property_id ?? '',
      entry_type: entryType,
      performed_at: entry.performed_at ? new Date(entry.performed_at) : null,
      performed_by_name: entry.performed_by_name ?? '',
      performed_by_user_ref: entry.performed_by_user_ref ?? '',
      location_label: entry.location_label ?? '',
      notes: entry.notes ?? '',
      equipment_label: entry.equipment_label ?? '',
    }))
    setDrawerOpened(true)

    if (entryType === 'pool_chemistry') {
      const { data } = await supabase
        .from('logbook_pool_chemistry_entries')
        .select('*')
        .eq('logbook_entry_id', entryId)
        .maybeSingle()
      if (data) {
        setFormState((prev) => ({
          ...prev,
          pool_name: data.pool_name ?? '',
          water_temp_f: data.water_temp_f ?? '',
          ph: data.ph ?? '',
          free_chlorine_ppm: data.free_chlorine_ppm ?? '',
          total_chlorine_ppm: data.total_chlorine_ppm ?? '',
          alkalinity_ppm: data.alkalinity_ppm ?? '',
          calcium_hardness_ppm: data.calcium_hardness_ppm ?? '',
          cyanuric_acid_ppm: data.cyanuric_acid_ppm ?? '',
          chemicals_added: data.chemicals_added ? JSON.stringify(data.chemicals_added, null, 2) : '',
          requires_follow_up: Boolean(data.requires_follow_up),
          follow_up_notes: data.follow_up_notes ?? '',
        }))
      }
    }

    if (entryType === 'hvac_refrigerant') {
      const { data } = await supabase
        .from('logbook_hvac_refrigerant_entries')
        .select('*')
        .eq('logbook_entry_id', entryId)
        .maybeSingle()
      if (data) {
        setFormState((prev) => ({
          ...prev,
          equipment_label: data.equipment_label ?? '',
          equipment_location: data.equipment_location ?? '',
          manufacturer: data.manufacturer ?? '',
          model_number: data.model_number ?? '',
          serial_number: data.serial_number ?? '',
          refrigerant_type: data.refrigerant_type ?? '',
          ambient_temp_f: data.ambient_temp_f ?? '',
          suction_pressure_psi: data.suction_pressure_psi ?? '',
          discharge_pressure_psi: data.discharge_pressure_psi ?? '',
          superheat_f: data.superheat_f ?? '',
          subcooling_f: data.subcooling_f ?? '',
          leak_check_performed: Boolean(data.leak_check_performed),
          leak_detected: Boolean(data.leak_detected),
          leak_method: data.leak_method ?? '',
          refrigerant_added_lbs: data.refrigerant_added_lbs ?? '',
          refrigerant_removed_lbs: data.refrigerant_removed_lbs ?? '',
          refrigerant_recovered_lbs: data.refrigerant_recovered_lbs ?? '',
          requires_follow_up: Boolean(data.requires_follow_up),
          follow_up_notes: data.follow_up_notes ?? '',
        }))
      }
    }
  }

  const handleSave = async () => {
    const requiredFields = ['property_id', 'entry_type', 'performed_at']
    if (requiredFields.some((field) => !formState[field])) {
      setError('Please fill in the required fields: Property, Entry type, Performed at.')
      return
    }
    if (formState.entry_type === 'hvac_refrigerant' && !formState.refrigerant_type) {
      setError('Please provide a refrigerant type for HVAC entries.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const parentPayload = {
        property_id: formState.property_id,
        entry_type: formState.entry_type,
        performed_at: formState.performed_at ? new Date(formState.performed_at).toISOString() : null,
        performed_by_name: formState.performed_by_name,
        performed_by_user_ref: formState.performed_by_user_ref,
        location_label: formState.location_label,
        notes: formState.notes,
      }

      let parentId = activeEntryId

      if (drawerMode === 'create') {
        const { data, error: insertError } = await supabase
          .from('logbook_entries')
          .insert(parentPayload)
          .select('*')
          .single()
        if (insertError) throw insertError
        parentId = data.id ?? data.logbook_entry_id ?? data.entry_id
      } else if (activeEntryId) {
        const { error: updateError } = await supabase
          .from('logbook_entries')
          .update(parentPayload)
          .eq('id', activeEntryId)
        if (updateError) throw updateError
      }

      if (!parentId) {
        throw new Error('Unable to determine parent logbook entry ID.')
      }

      if (formState.entry_type === 'pool_chemistry') {
        let chemicalsJson: Record<string, unknown> | unknown[] = {}
        if (formState.chemicals_added) {
          try {
            chemicalsJson = JSON.parse(formState.chemicals_added)
          } catch (err) {
            throw new Error('Chemicals added must be valid JSON.')
          }
        }
        const poolPayload = {
          logbook_entry_id: parentId,
          pool_name: formState.pool_name || null,
          water_temp_f: formState.water_temp_f || null,
          ph: formState.ph || null,
          free_chlorine_ppm: formState.free_chlorine_ppm || null,
          total_chlorine_ppm: formState.total_chlorine_ppm || null,
          alkalinity_ppm: formState.alkalinity_ppm || null,
          calcium_hardness_ppm: formState.calcium_hardness_ppm || null,
          cyanuric_acid_ppm: formState.cyanuric_acid_ppm || null,
          chemicals_added: chemicalsJson,
          requires_follow_up: Boolean(formState.requires_follow_up),
          follow_up_notes: formState.follow_up_notes || null,
        }
        const { error: poolError } = await supabase
          .from('logbook_pool_chemistry_entries')
          .upsert(poolPayload, { onConflict: 'logbook_entry_id' })
        if (poolError) {
          throw new Error(`Pool chemistry save failed. Parent id: ${parentId}. ${poolError.message}`)
        }
      }

      if (formState.entry_type === 'hvac_refrigerant') {
        const hvacPayload = {
          logbook_entry_id: parentId,
          equipment_label: formState.equipment_label || null,
          equipment_location: formState.equipment_location || null,
          manufacturer: formState.manufacturer || null,
          model_number: formState.model_number || null,
          serial_number: formState.serial_number || null,
          refrigerant_type: formState.refrigerant_type || null,
          ambient_temp_f: formState.ambient_temp_f || null,
          suction_pressure_psi: formState.suction_pressure_psi || null,
          discharge_pressure_psi: formState.discharge_pressure_psi || null,
          superheat_f: formState.superheat_f || null,
          subcooling_f: formState.subcooling_f || null,
          leak_check_performed: Boolean(formState.leak_check_performed),
          leak_detected: Boolean(formState.leak_detected),
          leak_method: formState.leak_method || null,
          refrigerant_added_lbs: formState.refrigerant_added_lbs || null,
          refrigerant_removed_lbs: formState.refrigerant_removed_lbs || null,
          refrigerant_recovered_lbs: formState.refrigerant_recovered_lbs || null,
          requires_follow_up: Boolean(formState.requires_follow_up),
          follow_up_notes: formState.follow_up_notes || null,
        }
        const { error: hvacError } = await supabase
          .from('logbook_hvac_refrigerant_entries')
          .upsert(hvacPayload, { onConflict: 'logbook_entry_id' })
        if (hvacError) {
          throw new Error(`HVAC save failed. Parent id: ${parentId}. ${hvacError.message}`)
        }
      }

      if (drawerMode === 'edit' && originalEntryType && originalEntryType !== formState.entry_type) {
        if (originalEntryType === 'pool_chemistry') {
          await supabase.from('logbook_pool_chemistry_entries').delete().eq('logbook_entry_id', parentId)
        }
        if (originalEntryType === 'hvac_refrigerant') {
          await supabase.from('logbook_hvac_refrigerant_entries').delete().eq('logbook_entry_id', parentId)
        }
      }

      await refreshEntries()
      notifications.show({
        title: 'Logbook saved',
        message:
          drawerMode === 'create'
            ? 'The logbook entry was created successfully.'
            : 'The logbook entry was updated successfully.',
        color: 'green',
      })
      setDrawerOpened(false)
      resetForm()
    } catch (err) {
      const message = (err as Error).message || 'Unable to save logbook entry.'
      setError(message)
      notifications.show({
        title: 'Save failed',
        message,
        color: 'red',
      })
    } finally {
      setSaving(false)
    }
  }

  const technicianOptionsData = technicianOptions.map((tech) => ({
    value: tech.userRef,
    label: tech.label,
  }))

  const entryTypeOptionsForm = [
    { value: 'pool_chemistry', label: 'Pool chemistry' },
    { value: 'hvac_refrigerant', label: 'HVAC refrigerant' },
  ]

  const columns = useMemo<ColDef<LogbookEntry>[]>(() => {
    return [
      {
        headerName: 'Date/Time',
        field: 'performed_at',
        minWidth: 180,
        valueGetter: (params) => params.data?.performed_at ?? null,
        cellRenderer: (params) => {
          const { label, full } = formatDateTime(params.value)
          return (
            <Text size="sm" title={full}>
              {label}
            </Text>
          )
        },
      },
      { headerName: 'Property', field: 'property_display_name', minWidth: 200, flex: 1 },
      { headerName: 'Type', field: 'entry_type', minWidth: 160 },
      { headerName: 'Completed by', field: 'performed_by_name', minWidth: 180 },
      { headerName: 'Location', field: 'location_label', minWidth: 160 },
      {
        headerName: 'Notes',
        field: 'notes',
        minWidth: 220,
        flex: 1,
        valueFormatter: ({ value }) => (value ? String(value).slice(0, 60) : ''),
      },
      {
        headerName: 'Actions',
        minWidth: 140,
        sortable: false,
        filter: false,
        cellRenderer: (params) => (
          <Button size="xs" variant="light" onClick={() => openEdit(params.data)}>
            View/Edit
          </Button>
        ),
      },
    ]
  }, [])

  return (
    <>
      <GlobalHeader variant="product" />
      <Box
        style={{
          paddingTop: GLOBAL_HEADER_HEIGHT,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'stretch',
        }}
      >
        <HpySidebar height={`calc(100vh - ${GLOBAL_HEADER_HEIGHT}px)`} />
        <Box style={{ flex: 1, padding: 56, display: 'flex', flexDirection: 'column' }}>
          <Stack gap="xl" style={{ flex: 1, minHeight: 0 }}>
            <HpyPageHeader
              title="Logbooks"
              appIconType="Inventory"
              ctaLabel="New Logbook Entry"
              onCtaClick={openCreate}
            />
            <Stack gap="lg" style={{ flex: 1, minHeight: 0 }}>
              {error ? (
                <Alert color="red" title="Connection Issue">
                  <Text size="sm">{error}</Text>
                </Alert>
              ) : loadingEntries ? (
                <Stack gap="xs">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} height={56} radius="md" />
                  ))}
                </Stack>
              ) : entries.length === 0 ? (
                <Alert color="yellow" title="No logbook entries">
                  <Text size="sm">No logbook entries are available yet.</Text>
                </Alert>
              ) : (
                <Box style={{ flex: 1, minHeight: 0 }} className="ag-theme-alpine">
                  <AgGridReact
                    {...AG_GRID_DEFAULT_GRID_PROPS}
                    rowData={entries}
                    columnDefs={columns}
                    defaultColDef={AG_GRID_DEFAULT_COL_DEF}
                    overlayNoRowsTemplate="No logbook entries found."
                    onRowClicked={(event) => openEdit(event.data)}
                  />
                </Box>
              )}
            </Stack>
          </Stack>
        </Box>
      </Box>
      <InlineEditorDrawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        title={drawerMode === 'create' ? 'New Logbook Entry' : 'Edit Logbook Entry'}
        withCloseButton
        footer={
          <>
            <Button variant="default" onClick={() => setDrawerOpened(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {drawerMode === 'create' ? 'Save' : 'Save changes'}
            </Button>
          </>
        }
      >
        {loadingDrawer ? (
          <Stack gap="sm">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} height={36} radius="md" />
            ))}
          </Stack>
        ) : (
          <Stack gap="md">
            <Group align="flex-end" wrap="wrap" gap="md">
              <Select
                label="Property"
                placeholder="Select property"
                data={propertyOptions}
                value={formState.property_id}
                onChange={(value) => setFormState((prev) => ({ ...prev, property_id: value ?? '' }))}
                required
                searchable
                comboboxProps={comboboxProps}
                dropdownZIndex={dropdownZIndex}
                styles={{
                  input: {
                    backgroundColor: 'var(--mantine-color-body)',
                    borderColor: 'var(--mantine-color-default-border)',
                  },
                }}
                style={{ minWidth: 240, flex: 1 }}
              />
              <Select
                label="Entry type"
                data={entryTypeOptionsForm}
                value={formState.entry_type}
                onChange={(value) =>
                  setFormState((prev) => ({ ...prev, entry_type: value ?? 'pool_chemistry' }))
                }
                required
                comboboxProps={comboboxProps}
                dropdownZIndex={dropdownZIndex}
                styles={{
                  input: {
                    backgroundColor: 'var(--mantine-color-body)',
                    borderColor: 'var(--mantine-color-default-border)',
                  },
                }}
                style={{ minWidth: 200 }}
              />
            </Group>
            <Group align="flex-end" wrap="wrap" gap="md">
              <DateTimePicker
                label="Performed at"
                value={formState.performed_at}
                onChange={(value) => setFormState((prev) => ({ ...prev, performed_at: value }))}
                required
                popoverProps={{ withinPortal: true, zIndex: dropdownZIndex }}
                style={{ minWidth: 240 }}
              />
              <Select
                label="Completed by"
                data={technicianOptionsData}
                value={formState.performed_by_user_ref}
                onChange={(value) => {
                  const selected = technicianOptions.find((tech) => tech.userRef === value)
                  setFormState((prev) => ({
                    ...prev,
                    performed_by_user_ref: value ?? '',
                    performed_by_name: selected?.name ?? '',
                  }))
                }}
                searchable
                clearable
                comboboxProps={comboboxProps}
                dropdownZIndex={dropdownZIndex}
                styles={{
                  input: {
                    backgroundColor: 'var(--mantine-color-body)',
                    borderColor: 'var(--mantine-color-default-border)',
                  },
                }}
                style={{ minWidth: 240, flex: 1 }}
              />
            </Group>
            <TextInput
              label="Location label"
              value={formState.location_label}
              onChange={(event) => setFormState((prev) => ({ ...prev, location_label: event.currentTarget.value }))}
              styles={{
                input: {
                  backgroundColor: 'var(--mantine-color-body)',
                  borderColor: 'var(--mantine-color-default-border)',
                },
              }}
            />
            <Textarea
              label="Notes"
              value={formState.notes}
              onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.currentTarget.value }))}
            />

            {formState.entry_type === 'pool_chemistry' && (
              <Stack gap="md">
                <Text fw={600}>Pool chemistry</Text>
                <Group align="flex-end" wrap="wrap" gap="md">
                  <TextInput
                    label="Pool name"
                    value={formState.pool_name}
                    onChange={(event) => setFormState((prev) => ({ ...prev, pool_name: event.currentTarget.value }))}
                  />
                  <TextInput
                    label="Water temp (F)"
                    value={formState.water_temp_f}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, water_temp_f: event.currentTarget.value }))
                    }
                  />
                  <TextInput
                    label="pH"
                    value={formState.ph}
                    onChange={(event) => setFormState((prev) => ({ ...prev, ph: event.currentTarget.value }))}
                  />
                  <TextInput
                    label="Free chlorine (ppm)"
                    value={formState.free_chlorine_ppm}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, free_chlorine_ppm: event.currentTarget.value }))
                    }
                  />
                  <TextInput
                    label="Total chlorine (ppm)"
                    value={formState.total_chlorine_ppm}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, total_chlorine_ppm: event.currentTarget.value }))
                    }
                  />
                  <TextInput
                    label="Alkalinity (ppm)"
                    value={formState.alkalinity_ppm}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, alkalinity_ppm: event.currentTarget.value }))
                    }
                  />
                  <TextInput
                    label="Calcium hardness (ppm)"
                    value={formState.calcium_hardness_ppm}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, calcium_hardness_ppm: event.currentTarget.value }))
                    }
                  />
                  <TextInput
                    label="Cyanuric acid (ppm)"
                    value={formState.cyanuric_acid_ppm}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, cyanuric_acid_ppm: event.currentTarget.value }))
                    }
                  />
                </Group>
                <Textarea
                  label="Chemicals added (JSON)"
                  value={formState.chemicals_added}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, chemicals_added: event.currentTarget.value }))
                  }
                />
                <Checkbox
                  label="Requires follow up"
                  checked={formState.requires_follow_up}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, requires_follow_up: event.currentTarget.checked }))
                  }
                />
                <Textarea
                  label="Follow up notes"
                  value={formState.follow_up_notes}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, follow_up_notes: event.currentTarget.value }))
                  }
                />
              </Stack>
            )}

            {formState.entry_type === 'hvac_refrigerant' && (
              <Stack gap="md">
                <Text fw={600}>HVAC refrigerant</Text>
                <Group align="flex-end" wrap="wrap" gap="md">
                  <TextInput
                    label="Equipment label"
                    value={formState.equipment_label}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, equipment_label: event.currentTarget.value }))
                    }
                  />
                  <TextInput
                    label="Equipment location"
                    value={formState.equipment_location}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, equipment_location: event.currentTarget.value }))
                    }
                  />
                  <TextInput
                    label="Manufacturer"
                    value={formState.manufacturer}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, manufacturer: event.currentTarget.value }))
                    }
                  />
                  <TextInput
                    label="Model number"
                    value={formState.model_number}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, model_number: event.currentTarget.value }))
                    }
                  />
                  <TextInput
                    label="Serial number"
                    value={formState.serial_number}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, serial_number: event.currentTarget.value }))
                    }
                  />
                  <TextInput
                    label="Refrigerant type"
                    value={formState.refrigerant_type}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, refrigerant_type: event.currentTarget.value }))
                    }
                    required
                  />
                </Group>
                <Group align="flex-end" wrap="wrap" gap="md">
                  <TextInput
                    label="Ambient temp (F)"
                    value={formState.ambient_temp_f}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, ambient_temp_f: event.currentTarget.value }))
                    }
                  />
                  <TextInput
                    label="Suction pressure (psi)"
                    value={formState.suction_pressure_psi}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, suction_pressure_psi: event.currentTarget.value }))
                    }
                  />
                  <TextInput
                    label="Discharge pressure (psi)"
                    value={formState.discharge_pressure_psi}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, discharge_pressure_psi: event.currentTarget.value }))
                    }
                  />
                  <TextInput
                    label="Superheat (F)"
                    value={formState.superheat_f}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, superheat_f: event.currentTarget.value }))
                    }
                  />
                  <TextInput
                    label="Subcooling (F)"
                    value={formState.subcooling_f}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, subcooling_f: event.currentTarget.value }))
                    }
                  />
                </Group>
                <Group align="flex-end" wrap="wrap" gap="md">
                  <TextInput
                    label="Refrigerant added (lbs)"
                    value={formState.refrigerant_added_lbs}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, refrigerant_added_lbs: event.currentTarget.value }))
                    }
                  />
                  <TextInput
                    label="Refrigerant removed (lbs)"
                    value={formState.refrigerant_removed_lbs}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, refrigerant_removed_lbs: event.currentTarget.value }))
                    }
                  />
                  <TextInput
                    label="Refrigerant recovered (lbs)"
                    value={formState.refrigerant_recovered_lbs}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, refrigerant_recovered_lbs: event.currentTarget.value }))
                    }
                  />
                </Group>
                <Checkbox
                  label="Leak check performed"
                  checked={formState.leak_check_performed}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, leak_check_performed: event.currentTarget.checked }))
                  }
                />
                {formState.leak_check_performed && (
                  <Checkbox
                    label="Leak detected"
                    checked={formState.leak_detected}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, leak_detected: event.currentTarget.checked }))
                    }
                  />
                )}
                {formState.leak_check_performed && formState.leak_detected && (
                  <TextInput
                    label="Leak method"
                    value={formState.leak_method}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, leak_method: event.currentTarget.value }))
                    }
                  />
                )}
                <Checkbox
                  label="Requires follow up"
                  checked={formState.requires_follow_up}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, requires_follow_up: event.currentTarget.checked }))
                  }
                />
                <Textarea
                  label="Follow up notes"
                  value={formState.follow_up_notes}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, follow_up_notes: event.currentTarget.value }))
                  }
                />
              </Stack>
            )}
          </Stack>
        )}
      </InlineEditorDrawer>
    </>
  )
}
