module.exports = {
  extends: ['@verkstedt/verkstedt'],
  env: {
    node: true,
    browser: true
  },
  rules: {
    "no-restricted-syntax": "off",
    "import/extensions": ["error", "always"]
  }
}
