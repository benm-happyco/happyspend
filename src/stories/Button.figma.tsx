import figma from '@figma/code-connect/react'
import { Button } from '@mantine/core'

const figmaUrl = import.meta.env.VITE_FIGMA_BUTTON_URL as string | undefined

if (figmaUrl) {
  figma.connect(Button, figmaUrl, {
    example: ({ children, ...props }) => <Button {...props}>{children ?? 'Button'}</Button>,
  })
}
