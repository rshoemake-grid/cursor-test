import {
  CONDITION_TYPES,
  isValidConditionType,
} from "../../../constants/stringLiterals";
function validateConditionConfig(config) {
  if (config === null || config === void 0) {
    return false;
  }
  const hasConditionType =
    config.condition_type !== null && config.condition_type !== void 0;
  if (hasConditionType === false) {
    return false;
  }
  const isValidType = isValidConditionType(config.condition_type) === true;
  if (isValidType === false) {
    return false;
  }
  const hasField =
    config.field !== null && config.field !== void 0 && config.field !== "";
  if (hasField === false) {
    return false;
  }
  return true;
}
function validateOperator(operator) {
  if (operator === null || operator === void 0) {
    return false;
  }
  if (operator === "") {
    return false;
  }
  const isValid = isValidConditionType(operator) === true;
  return isValid === true;
}
function validateOperands(field, value, conditionType) {
  const hasField = field !== null && field !== void 0 && field !== "";
  if (hasField === false) {
    return false;
  }
  const requiresValue =
    conditionType !== CONDITION_TYPES.EMPTY &&
    conditionType !== CONDITION_TYPES.NOT_EMPTY;
  if (requiresValue === true) {
    const hasValue = value !== null && value !== void 0 && value !== "";
    if (hasValue === false) {
      return false;
    }
  }
  return true;
}
function getDefaultConditionConfig() {
  return {
    condition_type: CONDITION_TYPES.EQUALS,
    field: "",
    value: "",
  };
}
export {
  getDefaultConditionConfig,
  validateConditionConfig,
  validateOperands,
  validateOperator,
};
