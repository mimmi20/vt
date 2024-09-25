import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettier from 'eslint-plugin-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  prettierConfig,
  ...tseslint.configs.recommended,
  {
    plugins: {
      prettier: prettier,
    },
    rules: {
      'prettier/prettier': 'error',
      'array-callback-return': 'error',
      'no-empty': [
        'error',
        {
          allowEmptyCatch: true,
        },
      ],
      'no-lonely-if': 'error',
      'no-var': 'error',
      'prefer-const': [
        'error',
        {
          destructuring: 'all',
          ignoreReadBeforeAssign: false,
        },
      ],
      'prefer-destructuring': [
        'error',
        {
          object: true,
          array: false,
        },
      ],
      'prefer-spread': 'error',
      radix: 'error',
      strict: 'error',
      quotes: ['error', 'single'],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  },
  {
    files: ['src/**/*.{mjs,ts}', 'eslint.config.mjs', 'postcss.config.mjs', 'prettier.config.mjs', 'stylelint.config.mjs', 'vite.config.ts', 'cypress.config.ts'],
    languageOptions: {
      sourceType: 'module',
    },
  },
  {
    ignores: [
      'src/**/*.d.ts',
      'src/**/*.js',
      'src/*.js',
      'public/**/*.{js,mjs,cjs,ts}',
      'src/js/vendor/*.{js,mjs,cjs,ts}',
      'src/js/vendor/**/*.{js,mjs,cjs,ts}',
      'src/dist/**/*.{js,mjs,cjs,ts}',
      'node_modules/**/*.{js,mjs,cjs,ts}',
      'vendor-bin/**/*.{js,mjs,cjs,ts}',
      'vendor/**/*.{js,mjs,cjs,ts}',
      '.build/**/*.{js,mjs,cjs,ts}',
      '.reports/**/*.{js,mjs,cjs,ts}',
      'cypress/**/*.js',
      'cypress/**/*.d.ts',
    ],
  }
);
