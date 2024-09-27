/**
 * @param {string} text
 * @return {string} HTML
 */
const insertWordBreaks = (text) =>
  text
    // zero width space before some special characters
    .replaceAll(/([/?_])/g, '\u200B$1')

export default insertWordBreaks
