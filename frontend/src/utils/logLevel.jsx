import {
  LOG_LEVELS,
  isValidLogLevel as isValidLogLevelConstant,
} from "../constants/stringLiterals";

/** Semantic tone for styled log lines and badges (replaces Tailwind class maps). */
const getLogLevelTone = (level) => {
  const levelMap = {
    [LOG_LEVELS.ERROR]: "error",
    [LOG_LEVELS.WARNING]: "warning",
    [LOG_LEVELS.INFO]: "info",
    [LOG_LEVELS.DEBUG]: "debug",
  };
  const tone = levelMap[level];
  return tone !== null && tone !== void 0 && tone !== ""
    ? tone
    : levelMap[LOG_LEVELS.INFO];
};

const isValidLogLevel = (level) => {
  return isValidLogLevelConstant(level);
};

export { getLogLevelTone, isValidLogLevel };
