module.exports = {
  extends: ['@verkstedt/verkstedt/vanilla'],
  env: {
    browser: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'no-restricted-syntax': 'off',
    'import/extensions': ['error', 'always'],
  },
}
