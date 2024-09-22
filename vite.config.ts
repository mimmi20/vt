import { defineConfig } from 'vitest/config';
import stylelint from 'vite-plugin-stylelint';
import { resolveToEsbuildTarget } from 'esbuild-plugin-browserslist';
import browserslist from 'browserslist';
import viteImagemin from '@vheemstra/vite-plugin-imagemin';
import imageminJpegtran from '@yeanzhi/imagemin-jpegtran';
import imageminPngquant from '@localnerve/imagemin-pngquant';
import imageminGif from '@localnerve/imagemin-gifsicle';
import imageminWebp from '@yeanzhi/imagemin-webp';
import imageminGifToWebp from 'imagemin-gif2webp';
import imageminAviv from '@vheemstra/imagemin-avifenc';
import imageminSvgo from '@koddsson/imagemin-svgo';

const target = resolveToEsbuildTarget(browserslist('defaults'), {
  printUnknownTargets: false,
});

export default defineConfig({
  root: __dirname,
  publicDir: 'public',
  base: '/dist/',
  plugins: [
    stylelint(),
    viteImagemin({
      plugins: {
        jpg: imageminJpegtran(),
        png: imageminPngquant({
          quality: [0.6, 0.8],
        }),
        gif: imageminGif(),
        svg: imageminSvgo({
          plugins: [
            {
              name: 'removeViewBox',
              active: false,
            },
          ],
        }),
      },
      onlyAssets: true,
      makeWebp: {
        plugins: {
          jpg: imageminWebp({ quality: 100 }),
          gif: imageminGifToWebp(),
        },
        skipIfLargerThan: 'optimized',
      },
      makeAvif: {
        plugins: {
          jpg: imageminAviv({ lossless: true }),
          png: imageminAviv({ lossless: true }),
        },
        skipIfLargerThan: 'optimized',
      },
    }),
  ],
  build: {
    target: target,
    outDir: 'public/dist', // relative to the `root` folder
    assetsDir: 'assets/',
    emptyOutDir: true,
    copyPublicDir: false,
    minify: false,
    manifest: true,
    assetsInlineLimit: 0,
    modulePreload: {
      polyfill: false,
    },
  },
  css: {
    devSourcemap: true,
    transformer: 'postcss',
  },
  server: {
    host: 'localhost',
    port: 8080,
    strictPort: true,
    hmr: {
      host: 'localhost',
      clientPort: 8080,
    },
    origin: 'http://localhost:8080',
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
});
