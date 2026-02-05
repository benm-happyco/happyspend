import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import App from './App.tsx'
import { customTheme } from './theme/theme.ts'
import './index.css'
import '@mantine/notifications/styles.css'
import 'leaflet/dist/leaflet.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider
      theme={customTheme}
      defaultColorScheme="light"
      cssVariablesResolver={(theme) => ({
        light: {
          '--mantine-color-default-border': theme.colors.gray[1],
        },
        dark: {
          '--mantine-color-default-border': theme.colors.dark[4],
        },
      })}
    >
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </React.StrictMode>,
)

