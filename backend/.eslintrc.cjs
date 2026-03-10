/* eslint-env node */
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parserOptions: { ecmaVersion: 2022 },
  extends: ['eslint:recommended'],
  rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  ignorePatterns: ['node_modules/', 'coverage/', 'dist/'],
  overrides: [
    { files: ['tests/**/*.js'], env: { node: true } },
  ],
};
