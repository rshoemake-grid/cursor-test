import { LOG_LEVELS, isValidLogLevel as isValidLogLevelConstant } from "../constants/stringLiterals";
const getLogLevelColor = (level) => {
  const levelMap = {
    [LOG_LEVELS.ERROR]: "bg-red-900/30 text-red-200",
    [LOG_LEVELS.WARNING]: "bg-yellow-900/30 text-yellow-200",
    [LOG_LEVELS.INFO]: "bg-gray-800 text-gray-300",
    [LOG_LEVELS.DEBUG]: "bg-blue-900/30 text-blue-200"
  };
  const color = levelMap[level];
  return color !== null && color !== void 0 && color !== "" ? color : levelMap[LOG_LEVELS.INFO];
};
const getLogLevelTextColor = (level) => {
  const levelMap = {
    [LOG_LEVELS.ERROR]: "text-red-400",
    [LOG_LEVELS.WARNING]: "text-yellow-400",
    [LOG_LEVELS.INFO]: "text-gray-300",
    [LOG_LEVELS.DEBUG]: "text-blue-400"
  };
  const color = levelMap[level];
  return color !== null && color !== void 0 && color !== "" ? color : levelMap[LOG_LEVELS.INFO];
};
const isValidLogLevel = (level) => {
  return isValidLogLevelConstant(level);
};
export {
  getLogLevelColor,
  getLogLevelTextColor,
  isValidLogLevel
};
