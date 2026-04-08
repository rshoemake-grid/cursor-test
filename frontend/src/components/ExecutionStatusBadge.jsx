import { memo } from "react";
import PropTypes from "prop-types";
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

ExecutionStatusBadge.propTypes = {
  status: PropTypes.string,
  variant: PropTypes.oneOf(["dark", "light"]),
  className: PropTypes.string,
};

export { ExecutionStatusBadge as default };
