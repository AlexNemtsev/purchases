import { defineConfig } from 'lint-staged/config';

export default defineConfig({
  '(*.ts|*.svelte)': ['eslint --fix --quiet', 'prettier --write', 'tsc -p tsconfig.node.json'],
  '*.css': ['stylelint --fix', 'prettier --write'],
  '*.json': ['prettier --write'],
});
