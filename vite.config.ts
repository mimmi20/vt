import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
    clearMocks: true,
    coverage: {
      provider: 'istanbul',
      enabled: true,
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: '.reports',
      include: ['src'],
    },
    testTimeout: 20000,
    // node14 segfaults often with threads
    threads: !process.versions.node.startsWith('14'),
  },
})
