/* eslint-env browser, es2022 */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parserOptions: { ecmaVersion: 2022, ecmaFeatures: { jsx: true }, sourceType: 'module' },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react/jsx-runtime'],
  plugins: ['react'],
  settings: { react: { version: '18' } },
  ignorePatterns: ['node_modules/', 'dist/'],
  rules: {
    'react/prop-types': 'off',
  },
};
