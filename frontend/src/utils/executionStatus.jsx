import {
  EXECUTION_STATUSES,
  isValidExecutionStatus as isValidExecutionStatusConstant,
} from "../constants/stringLiterals";

/** Semantic status for styled chips (invalid → paused, matching legacy color fallback). */
const getExecutionStatusTone = (status) => {
  if (isValidExecutionStatusConstant(status)) {
    return status;
  }
  return EXECUTION_STATUSES.PAUSED;
};

const isValidExecutionStatus = (status) => {
  return isValidExecutionStatusConstant(status);
};

export { getExecutionStatusTone, isValidExecutionStatus };
