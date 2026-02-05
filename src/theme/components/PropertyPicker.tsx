import { Button, Checkbox, Group, Popover, ScrollArea, Stack, Text, TextInput } from '@mantine/core'
import { useMemo, useState } from 'react'

export type PropertyPickerOption = { value: string; label: string }

type PropertyPickerProps = {
  options: PropertyPickerOption[]
  value: string[]
  onChange: (next: string[]) => void
  loading?: boolean
  maxSelected?: number
  label?: string
  searchPlaceholder?: string
  nothingFoundMessage?: string
  dropdownWidth?: number
  dropdownHeight?: number
}

function normalizeIds(ids: string[]) {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of ids) {
    if (typeof raw !== 'string') continue
    const id = raw.trim()
    if (!id) continue
    if (seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

export function PropertyPicker({
  options,
  value,
  onChange,
  loading,
  maxSelected,
  label = 'Properties',
  searchPlaceholder = 'Search properties',
  nothingFoundMessage = 'No matches',
  dropdownWidth = 420,
  dropdownHeight = 280,
}: PropertyPickerProps) {
  const [search, setSearch] = useState('')
  const [capHit, setCapHit] = useState(false)

  const normalizedValue = useMemo(() => normalizeIds(value), [value])
  const selectedSet = useMemo(() => new Set(normalizedValue), [normalizedValue])
  const capReached = maxSelected != null && normalizedValue.length >= maxSelected

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options.slice(0, 200)
    const matches: PropertyPickerOption[] = []
    for (const o of options) {
      if (o.label.toLowerCase().includes(q)) matches.push(o)
      if (matches.length >= 200) break
    }
    return matches
  }, [options, search])

  return (
    <Popover
      position="bottom-start"
      withArrow
      shadow="md"
      // Portal + flip/shift can get into expensive re-position loops in some layouts.
      // Keep it local and disable auto-flip/shift to avoid browser "hangs".
      withinPortal={false}
      middlewares={{ flip: false, shift: false }}
    >
      <Popover.Target>
        <Button variant="default" size="sm" loading={loading}>
          {label} ({normalizedValue.length})
        </Button>
      </Popover.Target>
      <Popover.Dropdown style={{ width: dropdownWidth }}>
        <Stack gap="sm">
          <TextInput
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            size="sm"
          />
          <ScrollArea h={dropdownHeight} type="auto">
            <Stack gap="xs">
              {filteredOptions.map((o) => {
                const checked = selectedSet.has(o.value)
                const disabled = !checked && capReached
                return (
                  <Checkbox
                    key={o.value}
                    label={o.label}
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => {
                      const nextChecked = e.currentTarget.checked
                      if (nextChecked) {
                        if (selectedSet.has(o.value)) return
                        if (maxSelected != null && normalizedValue.length >= maxSelected) {
                          setCapHit(true)
                          window.setTimeout(() => setCapHit(false), 1500)
                          return
                        }
                        onChange([...normalizedValue, o.value])
                        return
                      }
                      if (!selectedSet.has(o.value)) return
                      onChange(normalizedValue.filter((id) => id !== o.value))
                    }}
                  />
                )
              })}
              {filteredOptions.length === 0 && (
                <Text size="sm" c="dimmed">
                  {nothingFoundMessage}
                </Text>
              )}
            </Stack>
          </ScrollArea>
          <Group justify="space-between" gap="sm">
            <Button size="xs" variant="subtle" onClick={() => onChange([])}>
              Clear
            </Button>
            {maxSelected != null && (
              <Text size="xs" c={capHit ? 'red' : 'dimmed'}>
                Max {maxSelected} {capHit ? '(limit reached)' : ''}
              </Text>
            )}
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}

