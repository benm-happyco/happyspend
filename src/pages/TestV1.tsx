import { Button, Stack, Title } from '@mantine/core'

export function TestV1() {
  return (
    <Stack gap="md" align="flex-start">
      <Title order={1}>Hello World</Title>
      <Button>Click me</Button>
      <Button variant="subtle">Click me</Button>
      <Button variant="light">Click me</Button>
      <Button color="red">Click me</Button>
      <Button size="sm">Click me</Button>
      <Button size="sm" variant="subtle">Click me</Button>
      <Button size="sm" variant="light">Click me</Button>
      <Button size="sm" color="red">Click me</Button>
    </Stack>
  )
}
