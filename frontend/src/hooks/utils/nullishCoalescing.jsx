function nullishCoalesce(value, defaultValue) {
  if (value === null) {
    return defaultValue;
  }
  if (value === void 0) {
    return defaultValue;
  }
  return value;
}
function nullishCoalesceToNull(value) {
  if (value === null) {
    return null;
  }
  if (value === void 0) {
    return null;
  }
  return value;
}
export { nullishCoalesce, nullishCoalesceToNull };
