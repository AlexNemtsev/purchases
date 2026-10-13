import * as prettierPluginSvelte from 'prettier-plugin-svelte';
import * as prettierPluginTailwind from 'prettier-plugin-tailwindcss';

/** @type {import("prettier").Config} */
export default {
  endOfLine: 'auto',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  arrowParens: 'always',
  overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }],
  plugins: [prettierPluginSvelte, prettierPluginTailwind],
  tailwindStylesheet: './src/routes/app.css',
};
