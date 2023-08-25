function hasFocusedInput(context) {
  return Boolean(
    context.querySelector('input[focus]:not([type=submit]), textarea')
  )
}

export default hasFocusedInput
