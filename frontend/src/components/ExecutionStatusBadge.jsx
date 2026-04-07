import { memo } from "react";
import { isValidExecutionStatus } from "../utils/executionStatus";
import { EXECUTION_STATUSES } from "../constants/stringLiterals";
import { ExecutionStatusBadgeRoot } from "../styles/executionStatus.styled";

const ExecutionStatusBadge = memo(function ExecutionStatusBadge2({
  status,
  variant = "dark",
  className = "",
}) {
  const normalizedStatus =
    isValidExecutionStatus(status) === true
      ? status
      : EXECUTION_STATUSES.PENDING;
  return (
    <ExecutionStatusBadgeRoot
      className={className}
      $status={normalizedStatus}
      $variant={variant}
    >
      {normalizedStatus}
    </ExecutionStatusBadgeRoot>
  );
});
export { ExecutionStatusBadge as default };
