function isPlainObject(obj) {
  return obj !== null && Object.getPrototypeOf(obj) === Object.prototype
}

export default isPlainObject
