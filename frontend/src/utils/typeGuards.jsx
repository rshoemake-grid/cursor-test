function isNullOrUndefined(value) {
  return value === null || value === void 0;
}
function isDefined(value) {
  return value !== null && value !== void 0;
}
export {
  isDefined,
  isNullOrUndefined
};
