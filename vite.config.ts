import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  root: __dirname,
  build: {
    manifest: true,
  },
  css: {
    devSourcemap: false,
    postcss: path.resolve(__dirname, 'postcss.config.json'),
  },
  server: {
    port: 8080,
  },
  test: {
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
    clearMocks: true,

    reporters: ['default', 'junit'],
    outputFile: {
      junit: './junit-report.xml',
      html: './json-report.html',
    },

    coverage: {
      provider: 'istanbul',
      enabled: true,
      reporter: ['clover', 'text', 'html', 'lcov', 'lcovonly'],
      reportsDirectory: '.reports',
      include: ['src'],
    },
    testTimeout: 20000,
    // node14 segfaults often with threads
    threads: !process.versions.node.startsWith('14'),
  },
})
