import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import { createManualChunks } from './src/manual-chunks'

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      cy: path.resolve(__dirname, './cypress'),
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: createManualChunks,
      },
    },
  },
}))
