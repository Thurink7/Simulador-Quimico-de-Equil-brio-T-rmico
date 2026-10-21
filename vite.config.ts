import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
  },
  optimizeDeps: {
    include: [
      'scenerystack',
      'scenerystack/scenery',
      'scenerystack/kite',
      'scenerystack/dot',
      'scenerystack/axon',
    ],
  },
})
