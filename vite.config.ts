/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { alphaTab } from '@coderline/alphatab-vite'

export default defineConfig({
  // GitHub Pages serves the app from /<repo>/; locally it runs at /
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), alphaTab()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
