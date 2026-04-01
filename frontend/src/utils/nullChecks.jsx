function isNotNullOrUndefined(value) {
  return value !== null && value !== void 0;
}
function hasSize(set, threshold = 1) {
  return isNotNullOrUndefined(set) && set.size > threshold;
}
function hasMultipleSelected(selectedNodeIds) {
  return hasSize(selectedNodeIds, 1);
}
function isExplicitlyFalse(value) {
  return value === false;
}
function isNotEmpty(value) {
  return isNotNullOrUndefined(value) && value !== "";
}
function hasItems(array) {
  return isNotNullOrUndefined(array) && Array.isArray(array) && array.length > 0;
}
function isNonEmptyArray(array) {
  return hasItems(array);
}
function safeArray(array) {
  return isNotNullOrUndefined(array) && Array.isArray(array) ? array : [];
}
function getOrDefault(value, defaultValue) {
  return isNotNullOrUndefined(value) ? value : defaultValue;
}
export {
  getOrDefault,
  hasItems,
  hasMultipleSelected,
  hasSize,
  isExplicitlyFalse,
  isNonEmptyArray,
  isNotEmpty,
  isNotNullOrUndefined,
  safeArray
};
