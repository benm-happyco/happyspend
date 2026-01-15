import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [
        '/Users/benmoodie/AI/forge',
        '/Users/benmoodie/Desktop/react',
        '/Users/benmoodie/Desktop/core-stroke-rounded',
      ],
    },
  },
})



