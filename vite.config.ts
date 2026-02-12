import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative base makes the built site work when hosted under a subpath (e.g. GitHub Pages)
  // and also when previewed locally from any URL prefix.
  // Set base to the repository name so assets load correctly from GitHub Pages
  base: '/knowledge-bay/',
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})
