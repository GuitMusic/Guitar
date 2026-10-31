/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { alphaTab } from '@coderline/alphatab-vite'

export default defineConfig({
  plugins: [react(), alphaTab()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
