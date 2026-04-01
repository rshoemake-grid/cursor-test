function isValidArray(value) {
  return Array.isArray(value);
}
function hasArrayItems(array) {
  if (!isValidArray(array)) {
    return false;
  }
  return array.length > 0;
}
function isArrayEmpty(array) {
  if (!isValidArray(array)) {
    return true;
  }
  return array.length === 0;
}
function getArrayLength(array) {
  if (!isValidArray(array)) {
    return 0;
  }
  return array.length;
}
function canProcessArray(array) {
  return hasArrayItems(array);
}
export {
  canProcessArray,
  getArrayLength,
  hasArrayItems,
  isArrayEmpty,
  isValidArray
};
