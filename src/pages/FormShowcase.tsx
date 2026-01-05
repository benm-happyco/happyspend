import {
  Button,
  TextInput,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Switch,
  FileInput,
  Stack,
  Title,
  Paper,
  Group,
  Divider,
} from '@mantine/core'
import { useState } from 'react'

export function FormShowcase() {
  const [formData, setFormData] = useState({
    textInput: '',
    textarea: '',
    select: '',
    checkbox: false,
    radio: '',
    switch: false,
    file: null as File | null,
  })

  return (
    <Stack gap="xl" p="xl">
      <Title order={1}>Form Showcase</Title>
      <Paper p="xl" withBorder>
        <Stack gap="lg">
          <Title order={2}>Sample Form</Title>
          <Divider />

          {/* Buttons Section */}
          <Stack gap="md">
            <Title order={3}>Buttons</Title>
            <Group gap="md">
              <Button variant="filled" color="blurple">
                Primary Button
              </Button>
              <Button variant="outline" color="blurple">
                Secondary Button
              </Button>
              <Button variant="light" color="blurple">
                Light Button
              </Button>
              <Button variant="subtle" color="blurple">
                Subtle Button
              </Button>
            </Group>
            <Group gap="md">
              <Button variant="filled" color="blurple" disabled>
                Disabled Primary
              </Button>
              <Button variant="outline" color="blurple" disabled>
                Disabled Secondary
              </Button>
              <Button variant="filled" color="blurple" loading>
                Loading
              </Button>
            </Group>
          </Stack>

          <Divider />

          {/* Form Fields Section */}
          <Stack gap="md">
            <Title order={3}>Form Fields</Title>

            <TextInput
              label="Text Input"
              placeholder="Enter text here"
              value={formData.textInput}
              onChange={(e) => setFormData({ ...formData, textInput: e.currentTarget.value })}
            />

            <TextInput
              label="Text Input with Error"
              placeholder="This field has an error"
              error="This field is required"
            />

            <Textarea
              label="Textarea"
              placeholder="Enter multiple lines of text"
              rows={4}
              value={formData.textarea}
              onChange={(e) => setFormData({ ...formData, textarea: e.currentTarget.value })}
            />

            <Select
              label="Select Dropdown"
              placeholder="Choose an option"
              data={[
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' },
                { value: 'option3', label: 'Option 3' },
              ]}
              value={formData.select}
              onChange={(value) => setFormData({ ...formData, select: value || '' })}
            />

            <Checkbox
              label="Checkbox Option"
              checked={formData.checkbox}
              onChange={(e) => setFormData({ ...formData, checkbox: e.currentTarget.checked })}
            />

            <Radio.Group
              label="Radio Group"
              value={formData.radio}
              onChange={(value) => setFormData({ ...formData, radio: value })}
            >
              <Stack gap="xs" mt="xs">
                <Radio value="radio1" label="Radio Option 1" />
                <Radio value="radio2" label="Radio Option 2" />
                <Radio value="radio3" label="Radio Option 3" />
              </Stack>
            </Radio.Group>

            <Switch
              label="Toggle Switch"
              checked={formData.switch}
              onChange={(e) => setFormData({ ...formData, switch: e.currentTarget.checked })}
            />

            <FileInput
              label="File Upload"
              placeholder="Choose a file"
              value={formData.file}
              onChange={(file) => setFormData({ ...formData, file })}
            />
          </Stack>

          <Divider />

          {/* Form Actions */}
          <Group justify="flex-end" gap="md">
            <Button variant="outline" color="gray">
              Cancel
            </Button>
            <Button variant="filled" color="blurple">
              Submit
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  )
}


