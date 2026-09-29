import { defineConfig } from 'lint-staged/config';

export default defineConfig({
  '(*.js|*.ts|*.svelte)': ['eslint --fix --quiet'],
  '(*.css|*.svelte)': ['stylelint --fix'],
  '(*.js|*.ts|*.svelte|*.css|*.json)': ['prettier --write'],
});
