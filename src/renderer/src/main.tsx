import { DEFAULT_THEME, MantineProvider, createTheme, mergeMantineTheme } from '@mantine/core'
import '@mantine/core/styles.css'
import './assets/main.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

const themeOverride = createTheme({
  // This will be used as a default color for all components. Change it to your liking.
  // Reference for all available colors: https://mantine.dev/theming/colors/#default-colors
  primaryColor: 'violet',
  primaryShade: { light: 8, dark: 7 }
})

const theme = mergeMantineTheme(DEFAULT_THEME, themeOverride)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <App />
    </MantineProvider>
  </React.StrictMode>
)
