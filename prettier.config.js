import * as prettierPluginSvelte from 'prettier-plugin-svelte';

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
  plugins: [prettierPluginSvelte],
};
