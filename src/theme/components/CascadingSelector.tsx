import { useEffect, useMemo, useState } from 'react'
import {
  ActionIcon,
  Box,
  Combobox,
  Group,
  InputBase,
  Stack,
  Text,
  TextInput,
  useCombobox,
  useComputedColorScheme,
  useMantineTheme,
} from '@mantine/core'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, ArrowRight01Icon, Cancel01Icon } from '@hugeicons-pro/core-stroke-rounded'

export type CascadingSelectorItem = {
  value: string
  label: string
  children?: CascadingSelectorItem[]
}

export type CascadingSelectorRow = {
  id: string
  name: string
  parent_id: string | null
  sort_order?: number | null
}

export type CascadingSelectorValue = {
  parentValue: string
  childValue: string
}

type CascadingSelectorProps = {
  data: CascadingSelectorItem[]
  value?: CascadingSelectorValue | null
  defaultValue?: CascadingSelectorValue | null
  onChange?: (value: CascadingSelectorValue | null, meta?: { parent?: CascadingSelectorItem; child?: CascadingSelectorItem }) => void
  label?: string
  placeholder?: string
  searchPlaceholder?: string
  searchable?: boolean
  clearable?: boolean
  disabled?: boolean
  required?: boolean
  maxDropdownHeight?: number
  withinPortal?: boolean
  dropdownZIndex?: number
}

const findItemByValue = (items: CascadingSelectorItem[], value?: string | null) =>
  items.find((item) => item.value === value) ?? null

const findChildByValue = (items: CascadingSelectorItem[], childValue?: string | null) => {
  for (const item of items) {
    const match = item.children?.find((child) => child.value === childValue)
    if (match) return match
  }
  return null
}

const bySortThenLabel = (a: { sort_order?: number | null; label: string }, b: { sort_order?: number | null; label: string }) => {
  const sortA = a.sort_order ?? 0
  const sortB = b.sort_order ?? 0
  if (sortA !== sortB) return sortA - sortB
  return a.label.localeCompare(b.label)
}

export const buildCascadingSelectorData = (rows: CascadingSelectorRow[]) => {
  const parents = rows.filter((row) => !row.parent_id)
  const childrenByParent = rows.reduce<Record<string, CascadingSelectorRow[]>>((acc, row) => {
    if (!row.parent_id) return acc
    if (!acc[row.parent_id]) acc[row.parent_id] = []
    acc[row.parent_id].push(row)
    return acc
  }, {})

  return parents
    .map((parent) => ({
      value: parent.id,
      label: parent.name,
      sort_order: parent.sort_order ?? 0,
      children: (childrenByParent[parent.id] ?? [])
        .map((child) => ({
          value: child.id,
          label: child.name,
          sort_order: child.sort_order ?? 0,
        }))
        .sort(bySortThenLabel),
    }))
    .sort(bySortThenLabel)
    .map(({ value, label, children }) => ({ value, label, children }))
}

export function CascadingSelector({
  data,
  value,
  defaultValue = null,
  onChange,
  label,
  placeholder = 'Select',
  searchPlaceholder = 'Search',
  searchable = true,
  clearable = true,
  disabled = false,
  required = false,
  maxDropdownHeight = 280,
  withinPortal = true,
  dropdownZIndex = 4000,
}: CascadingSelectorProps) {
  const theme = useMantineTheme()
  const colorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption()
      setSearch('')
    },
  })

  const [internalValue, setInternalValue] = useState<CascadingSelectorValue | null>(defaultValue)
  const [search, setSearch] = useState('')
  const selectedValue = value ?? internalValue

  const [activeParentValue, setActiveParentValue] = useState<string | null>(
    selectedValue?.parentValue ?? data[0]?.value ?? null
  )

  useEffect(() => {
    if (!combobox.dropdownOpened) return
    if (selectedValue?.parentValue) {
      setActiveParentValue(selectedValue.parentValue)
      return
    }
    if (data[0]?.value) {
      setActiveParentValue(data[0].value)
    }
  }, [combobox.dropdownOpened, selectedValue, data])

  const normalizedSearch = search.trim().toLowerCase()

  const filteredParents = useMemo(() => {
    if (!normalizedSearch) return data
    return data.filter((parent) => {
      const parentMatch = parent.label.toLowerCase().includes(normalizedSearch)
      const childMatch = (parent.children ?? []).some((child) =>
        child.label.toLowerCase().includes(normalizedSearch)
      )
      return parentMatch || childMatch
    })
  }, [data, normalizedSearch])

  const activeParent = useMemo(() => {
    return (
      filteredParents.find((parent) => parent.value === activeParentValue) ??
      filteredParents[0] ??
      null
    )
  }, [filteredParents, activeParentValue])

  const filteredChildren = useMemo(() => {
    if (!activeParent) return []
    const children = activeParent.children ?? []
    if (!normalizedSearch) return children
    return children.filter((child) => child.label.toLowerCase().includes(normalizedSearch))
  }, [activeParent, normalizedSearch])

  const selectedParent = findItemByValue(data, selectedValue?.parentValue)
  const selectedChild = findChildByValue(data, selectedValue?.childValue)
  const displayLabel =
    selectedParent && selectedChild ? `${selectedParent.label} / ${selectedChild.label}` : ''

  const selectedBackground = colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1]
  const selectedTextColor = colorScheme === 'dark' ? theme.colors.dark[0] : theme.black

  const setValue = (next: CascadingSelectorValue | null, meta?: { parent?: CascadingSelectorItem; child?: CascadingSelectorItem }) => {
    if (value === undefined) {
      setInternalValue(next)
    }
    onChange?.(next, meta)
  }

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation()
    setValue(null)
  }

  const handleSelectChild = (child: CascadingSelectorItem) => {
    if (!activeParent) return
    const next = { parentValue: activeParent.value, childValue: child.value }
    setValue(next, { parent: activeParent, child })
    combobox.closeDropdown()
  }

  return (
    <Combobox
      store={combobox}
      withinPortal={withinPortal}
      zIndex={dropdownZIndex}
      disabled={disabled}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          label={label}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onClick={() => combobox.toggleDropdown()}
          rightSection={
            <Box
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 6,
                paddingRight: 6,
              }}
            >
              {clearable && selectedValue && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size={24}
                  onClick={handleClear}
                  aria-label="Clear selection"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </ActionIcon>
              )}
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
            </Box>
          }
          rightSectionWidth={selectedValue ? 72 : 44}
          rightSectionPointerEvents="auto"
          styles={{
            input: {
              cursor: 'pointer',
              backgroundColor: 'var(--mantine-color-body)',
              borderColor: 'var(--mantine-color-default-border)',
              textAlign: 'left',
              paddingRight: selectedValue ? 72 : 44,
            },
          }}
        >
          {displayLabel || (
            <Text size="sm" c="dimmed">
              {placeholder}
            </Text>
          )}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Stack gap="sm" p="sm">
          {searchable && (
            <TextInput
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              styles={{
                input: {
                  backgroundColor: 'var(--mantine-color-body)',
                  borderColor: 'var(--mantine-color-default-border)',
                },
              }}
            />
          )}

          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 220px) minmax(0, 1fr)',
              gap: 12,
              maxHeight: maxDropdownHeight,
              overflow: 'hidden',
            }}
          >
            <Box
              style={{
                borderRight: '1px solid var(--mantine-color-default-border)',
                paddingRight: 8,
                overflowY: 'auto',
                maxHeight: maxDropdownHeight,
              }}
            >
              <Stack gap={4}>
                {filteredParents.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    No results
                  </Text>
                ) : (
                  filteredParents.map((parent) => (
                    <Group
                      key={parent.value}
                      justify="space-between"
                      gap="xs"
                      onClick={() => setActiveParentValue(parent.value)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: theme.radius.sm,
                        cursor: 'pointer',
                        backgroundColor:
                          parent.value === activeParent?.value ? selectedBackground : 'transparent',
                        maxWidth: '100%',
                      }}
                    >
                      <Text
                        size="sm"
                        c={parent.value === activeParent?.value ? selectedTextColor : undefined}
                        style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {parent.label}
                      </Text>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </Group>
                  ))
                )}
              </Stack>
            </Box>

            <Box style={{ overflowY: 'auto', maxHeight: maxDropdownHeight }}>
              <Stack gap={4}>
                {activeParent && filteredChildren.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    No children available
                  </Text>
                ) : (
                  filteredChildren.map((child) => (
                    <Box
                      key={child.value}
                      onClick={() => handleSelectChild(child)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: theme.radius.sm,
                        cursor: 'pointer',
                        backgroundColor:
                          selectedValue?.childValue === child.value ? selectedBackground : 'transparent',
                        maxWidth: '100%',
                      }}
                    >
                      <Text
                        size="sm"
                        c={selectedValue?.childValue === child.value ? selectedTextColor : undefined}
                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {child.label}
                      </Text>
                    </Box>
                  ))
                )}
              </Stack>
            </Box>
          </Box>
        </Stack>
      </Combobox.Dropdown>
    </Combobox>
  )
}
