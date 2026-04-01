function logicalOr(value, fallback) {
  if (value) {
    return value;
  }
  return fallback;
}
function logicalOrToNull(value) {
  if (value) {
    return value;
  }
  return null;
}
function logicalOrToEmptyObject(value) {
  if (value) {
    return value;
  }
  return {};
}
function logicalOrToEmptyArray(value) {
  if (value) {
    return value;
  }
  return [];
}
function logicalOrToUndefined(value) {
  if (value) {
    return value;
  }
  return void 0;
}
export {
  logicalOr,
  logicalOrToEmptyArray,
  logicalOrToEmptyObject,
  logicalOrToNull,
  logicalOrToUndefined
};
