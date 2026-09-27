import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Vite 8 (rolldown) ships a fast oxc minifier by default — keep it.
    sourcemap: false,
    // Warn when a chunk grows beyond 500 kB so regressions are visible.
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Split big vendor libs into cacheable chunks so app-code changes
        // don't invalidate the whole bundle and browsers can cache them.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) return 'charts'
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('@tabler/icons-react')) return 'tabler-icons'
          if (id.includes('react-icons')) return 'react-icons'
          if (id.includes('react-dom')) return 'react-dom'
          if (id.includes('react-router')) return 'router'
          return 'vendor'
        },
      },
    },
  },
  // Pre-bundle deps once so cold dev-server starts are fast.
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'react-toastify'],
  },
})
