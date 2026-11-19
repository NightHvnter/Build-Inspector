import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// GitHub Pages serves the site from /<repo>/: the Pages workflow sets SITE_BASE=/Build-Inspector/.
export default defineConfig({
  base: process.env.SITE_BASE ?? '/',
  plugins: [react()],
})
