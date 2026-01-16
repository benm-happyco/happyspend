import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import App from './App.tsx'
import { customTheme } from './theme/theme.ts'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={customTheme} defaultColorScheme="light">
      <App />
    </MantineProvider>
  </React.StrictMode>,
)

