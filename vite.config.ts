import { defineConfig } from 'vitest/config'

export default defineConfig({
  build: {
    manifest: true,
  },
  test: {
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
    clearMocks: true,
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
