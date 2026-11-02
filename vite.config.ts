/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { alphaTab } from '@coderline/alphatab-vite'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'

/**
 * Tells the offline service worker which hashed files this build uses, so it can drop the
 * copies an earlier version cached (otherwise every update adds a few MB that never go away).
 */
function swAssetList(): Plugin {
  let outDir = 'dist'
  return {
    name: 'sw-asset-list',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    writeBundle(_options, bundle) {
      const file = join(outDir, 'sw.js')
      const assets = Object.keys(bundle).filter((f) => f.startsWith('assets/'))
      writeFileSync(file, readFileSync(file, 'utf8').replace('self.__ASSETS__', JSON.stringify(assets)))
    },
  }
}

export default defineConfig({
  // GitHub Pages serves the app from /<repo>/; locally it runs at /
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), alphaTab(), swAssetList()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
