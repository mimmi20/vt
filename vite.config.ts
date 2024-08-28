import { defineConfig } from 'vitest/config';
import stylelint from 'vite-plugin-stylelint';
import eslint from 'vite-plugin-eslint';
import { resolveToEsbuildTarget } from 'esbuild-plugin-browserslist';
import browserslist from 'browserslist';

const target = resolveToEsbuildTarget(browserslist('defaults'), {
  printUnknownTargets: false,
});

export default defineConfig({
  root: __dirname,
  plugins: [
    stylelint(),
    eslint(),
  ],
  build: {
    manifest: true,
    target: target,
  },
  css: {
    devSourcemap: true,
    transformer: 'postcss',
    preprocessorOptions: {
      scss: {
        outputStyle: 'expanded',
        alertAscii: true,
        alertColor: true,
        verbose: true,
      }
    }
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
    threads: !process.versions.node.startsWith('14')
  },
})
