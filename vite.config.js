import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/Chung2film.equipment/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
