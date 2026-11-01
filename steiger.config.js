import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    files: ['src/features/**/*', 'src/widgets/**/*'],
    rules: {
      // SvelteKit routes are the app's pages layer, but Steiger does not recognize it.
      'fsd/insignificant-slice': 'off',
    },
  },
  {
    files: [
      'src/app/**/*',
      'src/widgets/**/*',
      'src/features/**/*',
      'src/entities/**/*',
      'src/shared/**/*',
    ],
    rules: {
      'fsd/no-cross-imports': 'error',
      'fsd/no-higher-level-imports': 'error',
    },
  },
]);
