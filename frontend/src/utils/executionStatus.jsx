import {
  EXECUTION_STATUSES,
  isValidExecutionStatus as isValidExecutionStatusConstant,
} from "../constants/stringLiterals";
const getExecutionStatusColor = (status) => {
  const statusMap = {
    [EXECUTION_STATUSES.COMPLETED]: "bg-green-900 text-green-200",
    [EXECUTION_STATUSES.FAILED]: "bg-red-900 text-red-200",
    [EXECUTION_STATUSES.RUNNING]: "bg-blue-900 text-blue-200",
    [EXECUTION_STATUSES.PENDING]: "bg-yellow-900 text-yellow-200",
    [EXECUTION_STATUSES.PAUSED]: "bg-gray-900 text-gray-200",
  };
  const color = statusMap[status];
  return color !== null && color !== void 0 && color !== ""
    ? color
    : statusMap[EXECUTION_STATUSES.PAUSED];
};
const getExecutionStatusColorLight = (status) => {
  const statusMap = {
    [EXECUTION_STATUSES.COMPLETED]: "bg-green-100 text-green-800",
    [EXECUTION_STATUSES.FAILED]: "bg-red-100 text-red-800",
    [EXECUTION_STATUSES.RUNNING]: "bg-blue-100 text-blue-800",
    [EXECUTION_STATUSES.PENDING]: "bg-yellow-100 text-yellow-800",
    [EXECUTION_STATUSES.PAUSED]: "bg-gray-100 text-gray-800",
  };
  const color = statusMap[status];
  return color !== null && color !== void 0 && color !== ""
    ? color
    : statusMap[EXECUTION_STATUSES.PAUSED];
};
const isValidExecutionStatus = (status) => {
  return isValidExecutionStatusConstant(status);
};
export {
  getExecutionStatusColor,
  getExecutionStatusColorLight,
  isValidExecutionStatus,
};
