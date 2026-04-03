import { parsePath, validatePath } from "../hooks/utils/pathParser";
import { isNullOrUndefined } from "./typeGuards";
import { coalesce } from "./coalesce";
class ArrayCloner {
  canHandle(value) {
    return Array.isArray(value) === true;
  }
  clone(value) {
    return [...value];
  }
}
class ObjectCloner {
  canHandle(value) {
    const isObject = typeof value === "object";
    const isNotNull = value !== null;
    const isNotArray = Array.isArray(value) === false;
    return isObject === true && isNotNull === true && isNotArray === true;
  }
  clone(value) {
    return { ...value };
  }
}
class DefaultCloner {
  canHandle(_value) {
    return true;
  }
  clone(value) {
    return value;
  }
}
const CLONERS = [new ArrayCloner(), new ObjectCloner(), new DefaultCloner()];
function cloneValue(value) {
  for (const cloner of CLONERS) {
    if (cloner.canHandle(value) === true) {
      return cloner.clone(value);
    }
  }
  return value;
}
function validateInputs(obj, path) {
  if (isNullOrUndefined(obj) === true) return false;
  if (isNullOrUndefined(path) === true) return false;
  if (path === "") return false;
  const isValidPath = validatePath(path) === true;
  return isValidPath === true;
}
function traversePath(obj, keys) {
  if (isNullOrUndefined(obj) === true) return null;
  if (keys.length === 0) return null;
  let currentValue = obj;
  const lastIndex = keys.length - 1;
  for (let i = 0; i < lastIndex; i++) {
    const currentKey = keys[i];
    if (isNullOrUndefined(currentValue) === true) {
      return null;
    }
    currentValue = currentValue[currentKey];
  }
  return {
    value: currentValue,
    parent: currentValue,
    lastKey: keys[lastIndex],
  };
}
function getNestedValue(obj, path, defaultValue) {
  if (validateInputs(obj, path) === false) {
    return defaultValue;
  }
  const keys = parsePath(path);
  if (keys.length === 0) return defaultValue;
  const result = traversePath(obj, keys);
  if (isNullOrUndefined(result) === true) return defaultValue;
  if (isNullOrUndefined(result.value) === true) {
    return defaultValue;
  }
  const keyExists = result.lastKey in result.value === true;
  if (keyExists === false) {
    return defaultValue;
  }
  const finalValue = result.value[result.lastKey];
  return coalesce(finalValue, defaultValue);
}
function setNestedValue(obj, path, value) {
  if (validateInputs(obj, path) === false) {
    return obj;
  }
  const keys = parsePath(path);
  if (keys.length === 0) return obj;
  const result = { ...obj };
  let current = result;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (isNullOrUndefined(current[key]) === true) {
      current[key] = {};
    } else {
      const cloned = cloneValue(current[key]);
      const isObject = typeof cloned === "object";
      const isNotNull = cloned !== null;
      if (isObject === true && isNotNull === true) {
        current[key] = cloned;
      } else {
        return obj;
      }
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
  return result;
}
function hasNestedValue(obj, path) {
  if (validateInputs(obj, path) === false) return false;
  const keys = parsePath(path);
  if (keys.length === 0) return false;
  const result = traversePath(obj, keys);
  if (isNullOrUndefined(result) === true) return false;
  if (isNullOrUndefined(result.value) === true) {
    return false;
  }
  const keyExists = result.lastKey in result.value === true;
  return keyExists;
}
export { getNestedValue, hasNestedValue, setNestedValue };
