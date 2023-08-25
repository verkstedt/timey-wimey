import isPlainObject from './isPlainObject.mjs'

function createOptionsDocumentFragment(document, values) {
  const options = document.createDocumentFragment()
  options.appendChild(document.createElement('option'))
  const valuesEntries = Array.isArray(values)
    ? values
    : Array.from(Object.entries(values))
  valuesEntries.forEach((row) => {
    let value
    let label
    let attrs = {}

    if (!Array.isArray(row)) {
      value = row
    } else if (isPlainObject(row[1])) {
      ;[value, { label, ...attrs }] = row
    } else {
      ;[value, label] = row
    }

    attrs.value = value

    const option = document.createElement('option')
    Object.entries(attrs).forEach(([attrName, attrValue]) => {
      option.setAttribute(attrName, attrValue)
    })
    if (label != null && label !== value) {
      option.textContent = label
    }
    options.appendChild(option)
  })
  return options
}

function setSelectValues(values, selectElement) {
  const document = selectElement.ownerDocument

  const options = createOptionsDocumentFragment(document, values)
  // eslint-disable-next-line no-param-reassign
  selectElement.innerHTML = ''
  selectElement.appendChild(options)
}

export default setSelectValues
