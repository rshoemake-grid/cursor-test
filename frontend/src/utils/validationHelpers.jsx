function isTruthy(value) {
  if (value === null || value === void 0) return false;
  if (typeof value === "string" && value === "") return false;
  if (typeof value === "number" && value === 0) return false;
  if (typeof value === "boolean" && value === false) return false;
  return true;
}
function isFalsy(value) {
  return !isTruthy(value);
}
function allTruthy(...values) {
  for (const value of values) {
    if (!isTruthy(value)) {
      return false;
    }
  }
  return true;
}
function anyTruthy(...values) {
  for (const value of values) {
    if (isTruthy(value)) {
      return true;
    }
  }
  return false;
}
function canUserOperate(user) {
  if (user === null || user === void 0) {
    return false;
  }
  if (user.id === null || user.id === void 0) {
    return false;
  }
  return true;
}
function hasArrayItems(array) {
  if (array === null || array === void 0) {
    return false;
  }
  if (!Array.isArray(array)) {
    return false;
  }
  if (array.length === 0) {
    return false;
  }
  return true;
}
function isValidObject(obj) {
  if (obj === null || obj === void 0) {
    return false;
  }
  if (typeof obj !== "object") {
    return false;
  }
  if (Array.isArray(obj)) {
    return false;
  }
  return true;
}
function isNonEmptyString(str) {
  if (str === null || str === void 0) {
    return false;
  }
  if (typeof str !== "string") {
    return false;
  }
  if (str === "") {
    return false;
  }
  return true;
}
function isValidNumber(num) {
  if (num === null || num === void 0) {
    return false;
  }
  if (typeof num !== "number") {
    return false;
  }
  if (isNaN(num)) {
    return false;
  }
  if (!isFinite(num)) {
    return false;
  }
  return true;
}
export {
  allTruthy,
  anyTruthy,
  canUserOperate,
  hasArrayItems,
  isFalsy,
  isNonEmptyString,
  isTruthy,
  isValidNumber,
  isValidObject,
};
