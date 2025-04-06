import { defineConfig } from 'vitest/config';
import viteImagemin from '@vheemstra/vite-plugin-imagemin';
import imageminJpegtran from '@yeanzhi/imagemin-jpegtran';
import imageminPngquant from '@localnerve/imagemin-pngquant';
import imageminGif from '@localnerve/imagemin-gifsicle';
import imageminWebp from '@yeanzhi/imagemin-webp';
import imageminGifToWebp from 'imagemin-gif2webp';
import imageminAviv from '@vheemstra/imagemin-avifenc';
import imageminSvgo from '@koddsson/imagemin-svgo';
import { resolveToEsbuildTarget } from 'esbuild-plugin-browserslist';
import browserslist from 'browserslist';
import { compression } from 'vite-plugin-compression2';

const target = resolveToEsbuildTarget(browserslist('defaults'), {
  printUnknownTargets: false,
});

const SvgoOpts = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          removeComments: true,
          cleanupNumericValues: {
            floatPrecision: 2,
          },
          convertColors: {
            shortname: false,
          },
        },
      },
    },
  ],
};

export default defineConfig({
  appType: 'custom',
  root: __dirname,
  publicDir: 'public',
  base: '/dist/',
  plugins: [
    viteImagemin({
      plugins: {
        jpg: imageminJpegtran(),
        png: imageminPngquant({
          quality: [0.8, 1],
        }),
        gif: imageminGif(),
        svg: imageminSvgo(SvgoOpts),
      },
      onlyAssets: true,
      skipIfLarger: true,
      clearCache: true,
      makeWebp: {
        plugins: {
          jpg: imageminWebp({ quality: 100 }),
          png: imageminWebp({ quality: 100 }),
          gif: imageminGifToWebp({ quality: 82 }),
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
    compression({ deleteOriginalAssets: false, skipIfLargerOrEqual: true, algorithm: 'gzip', include: /\.(html|css|js|cjs|mjs|svg|woff|woff2|json|jpeg|jpg|gif|png|webp|avif)$/ }),
    compression({ deleteOriginalAssets: false, skipIfLargerOrEqual: true, algorithm: 'brotliCompress', include: /\.(html|css|js|cjs|mjs|svg|woff|woff2|json|jpeg|jpg|gif|png|webp|avif)$/ }),
  ],
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
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        outputStyle: 'expanded',
        alertAscii: true,
        alertColor: true,
        verbose: true,
      },
    },
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
  },
});
