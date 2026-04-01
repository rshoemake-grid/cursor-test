import { isNullOrUndefined } from "./typeGuards";
import { coalesce } from "./coalesce";
function safeGet(obj, path, defaultValue) {
  if (isNullOrUndefined(obj)) {
    return defaultValue;
  }
  let current = obj;
  for (const key of path) {
    if (isNullOrUndefined(current)) {
      return defaultValue;
    }
    current = current[key];
  }
  return coalesce(current, defaultValue);
}
function safeGetProperty(obj, property, defaultValue) {
  if (isNullOrUndefined(obj)) {
    return defaultValue;
  }
  const value = obj[property];
  return coalesce(value, defaultValue);
}
function safeCall(obj, methodName, args = [], defaultValue) {
  if (isNullOrUndefined(obj)) {
    return defaultValue;
  }
  const method = obj[methodName];
  if (typeof method !== "function") {
    return defaultValue;
  }
  try {
    const result = method.apply(obj, args);
    return coalesce(result, defaultValue);
  } catch {
    return defaultValue;
  }
}
function safeGetArrayElement(arr, index, defaultValue) {
  if (isNullOrUndefined(arr)) {
    return defaultValue;
  }
  if (!Array.isArray(arr)) {
    return defaultValue;
  }
  if (index < 0 || index >= arr.length) {
    return defaultValue;
  }
  const value = arr[index];
  return coalesce(value, defaultValue);
}
export {
  safeCall,
  safeGet,
  safeGetArrayElement,
  safeGetProperty
};
