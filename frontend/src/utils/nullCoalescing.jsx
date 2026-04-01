function coalesce(value, defaultValue) {
  if (value !== null && value !== void 0) {
    return value;
  }
  return defaultValue;
}
function coalesceObject(value, defaultValue) {
  if (value !== null && value !== void 0 && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length >= 0) {
    return value;
  }
  return defaultValue;
}
function coalesceArray(value, defaultValue) {
  if (value !== null && value !== void 0 && Array.isArray(value)) {
    return value;
  }
  return defaultValue;
}
function coalesceString(value, defaultValue) {
  if (value !== null && value !== void 0 && typeof value === "string" && value !== "") {
    return value;
  }
  return defaultValue;
}
function coalesceChain(...values) {
  for (const value of values) {
    if (value !== null && value !== void 0) {
      return value;
    }
  }
  return null;
}
function coalesceChainWithDefault(defaultValue, ...values) {
  for (const value of values) {
    if (value !== null && value !== void 0) {
      return value;
    }
  }
  return defaultValue;
}
function coalesceObjectChain(defaultValue, ...values) {
  for (const value of values) {
    if (value !== null && value !== void 0 && typeof value === "object" && !Array.isArray(value)) {
      return value;
    }
  }
  return defaultValue;
}
function coalesceArrayChain(defaultValue, ...values) {
  for (const value of values) {
    if (value !== null && value !== void 0 && Array.isArray(value)) {
      return value;
    }
  }
  return defaultValue;
}
function coalesceStringChain(defaultValue, ...values) {
  for (const value of values) {
    if (value !== null && value !== void 0 && typeof value === "string" && value !== "") {
      return value;
    }
  }
  return defaultValue;
}
export {
  coalesce,
  coalesceArray,
  coalesceArrayChain,
  coalesceChain,
  coalesceChainWithDefault,
  coalesceObject,
  coalesceObjectChain,
  coalesceString,
  coalesceStringChain
};
