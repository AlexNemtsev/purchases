import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import { importX } from 'eslint-plugin-import-x';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: ['dist', '.svelte-kit'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs.recommended,
  prettier,

  {
    files: ['**/*.{js,ts,svelte}'],

    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
    },

    plugins: {
      'import-x': importX,
      prettier: eslintPluginPrettier,
    },

    extends: ['import-x/flat/recommended'],

    settings: {
      'import-x/resolver': {
        typescript: {},
      },
    },

    rules: {
      /*
       * Prettier
       */
      'prettier/prettier': 'error',

      /*
       * TypeScript
       */
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          destructuredArrayIgnorePattern: '^_',
        },
      ],

      /*
       * Imports
       */
      'import-x/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          ts: 'never',
        },
      ],

      'import-x/named': 'error',
      'import-x/no-named-default': 'error',
      'import-x/default': 'error',
      'import-x/prefer-default-export': 'off',
      'import-x/no-default-export': 'error',

      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          pathGroups: [
            {
              pattern: 'src/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      /*
       * General JS/TS
       */
      'no-param-reassign': [
        'error',
        {
          props: true,
          ignorePropertyModificationsFor: [
            'acc',
            'accumulator',
            'e',
            'ctx',
            'context',
            'req',
            'request',
            'res',
            'response',
            '$scope',
            'staticContext',
            'draft',
            'state',
          ],
        },
      ],

      'func-style': ['error', 'expression'],

      'no-console': [
        'error',
        {
          allow: ['warn', 'error', 'info', 'groupCollapsed', 'groupEnd'],
        },
      ],

      'no-nested-ternary': 'error',
      curly: ['error', 'all'],
      'no-alert': 'error',

      'template-curly-spacing': 'error',

      'max-len': [
        'warn',
        {
          code: 100,
          ignorePattern: '^import .*',
        },
      ],

      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: '*',
          next: ['multiline-block-like', 'return', 'multiline-expression', 'switch', 'try'],
        },
        {
          blankLine: 'always',
          prev: ['multiline-block-like', 'export', 'multiline-expression', 'switch', 'try'],
          next: '*',
        },
      ],
    },
  },

  /*
   * Svelte-specific configuration
   */
  {
    files: ['**/*.svelte'],

    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  /*
   * Svelte 5 runes in .svelte.ts / .svelte.js files
   */
  {
    files: ['**/*.svelte.ts', '**/*.svelte.js'],

    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  /*
   * Config files
   */
  {
    files: ['*.config.*', '**/*.config.*'],
    rules: {
      'import-x/no-default-export': 'off',
      'import-x/no-unresolved': 'off',
      'import-x/no-extraneous-dependencies': 'off',
    },
  },
  // В main.ts для svelte требуется экспорт по-умолчанию
  {
    files: ['./src/main.ts'],
    rules: {
      'import-x/no-default-export': 'off',
    },
  },
  {
    // файл содержит виртуальный модуль из vite-pwa
    files: ['./src/app/ui/ReloadPrompt.svelte'],
    rules: {
      'import-x/no-unresolved': 'off',
      'no-console': 'off',
    },
  }
);
