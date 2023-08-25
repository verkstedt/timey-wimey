const namePattern =
  '^[amotu]-[a-z][a-zA-Z0-9]*(__[a-zA-Z0-9]*|)(--[a-zA-Z0-9]*|)$'

module.exports = {
  extends: ['@verkstedt/eslint-config-verkstedt/stylelint-config'],
  plugins: ['stylelint-no-unsupported-browser-features'],
  rules: {
    'keyframes-name-pattern': namePattern,
    'selector-class-pattern': namePattern,
  },
}
