import { jsx } from "react/jsx-runtime";
import { memo } from "react";
import { getExecutionStatusColor, getExecutionStatusColorLight, isValidExecutionStatus } from "../utils/executionStatus";
import { EXECUTION_STATUSES } from "../constants/stringLiterals";
const ExecutionStatusBadge = memo(function ExecutionStatusBadge2({
  status,
  variant = "dark",
  className = ""
}) {
  const normalizedStatus = isValidExecutionStatus(status) === true ? status : EXECUTION_STATUSES.PENDING;
  const colorClasses = variant === "light" ? getExecutionStatusColorLight(normalizedStatus) : getExecutionStatusColor(normalizedStatus);
  return /* @__PURE__ */ jsx("div", { className: `px-3 py-1 rounded text-sm font-medium ${colorClasses} ${className}`, children: normalizedStatus });
});
var stdin_default = ExecutionStatusBadge;
export {
  stdin_default as default
};
