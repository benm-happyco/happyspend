import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stack, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import {
  CascadingSelector,
  buildCascadingSelectorData,
  type CascadingSelectorItem,
} from '../theme/components/CascadingSelector'
import { supabase } from '../lib/supabase'

const meta = {
  title: 'Theme/Cascading Selector',
  component: CascadingSelector,
  parameters: {
    layout: 'centered',
  },
  args: {
    data: [] as CascadingSelectorItem[],
    placeholder: 'Select',
    searchable: true,
    clearable: true,
  },
  argTypes: {
    data: { control: false },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CascadingSelector>

export default meta
type Story = StoryObj<typeof meta>

const CascadingSelectorDemo = (args: Story['args']) => {
  const [data, setData] = useState<CascadingSelectorItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('maintenance_categories')
          .select('*')
          .order('sort_order', { ascending: true })
        if (error) throw error
        if (!mounted) return
        setData(buildCascadingSelectorData(data ?? []))
      } catch (err) {
        if (!mounted) return
        setError((err as Error).message || 'Unable to load maintenance categories.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchCategories()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <Stack gap="xs" style={{ width: 360 }}>
      <CascadingSelector
        {...args}
        data={data}
        disabled={loading}
        placeholder={loading ? 'Loading categories...' : args?.placeholder}
      />
      {error ? (
        <Text size="xs" c="red">
          {error}
        </Text>
      ) : (
        <Text size="xs" c="dimmed">
          {loading ? 'Fetching live categories from Supabase.' : 'Select a parent and child.'}
        </Text>
      )}
    </Stack>
  )
}

export const Demo: Story = {
  render: (args) => (
    <CascadingSelectorDemo {...args} />
  ),
}
