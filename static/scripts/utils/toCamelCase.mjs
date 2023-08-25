const FIRST_LETTER_REGEXP = /[-_\s]+(.)/g

function toCamelCase(string) {
  return string.replace(FIRST_LETTER_REGEXP, (_, letter) =>
    letter.toUpperCase()
  )
}

export default toCamelCase
