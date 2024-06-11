/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
      react(),
      TanStackRouterVite(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    //environment: 'jsdom',
    include:["./test/**/*.test.ts"],
  },
})
