import { jsx as _jsx } from "react/jsx-runtime";
import { memo } from 'react';
import { getExecutionStatusColor, getExecutionStatusColorLight, isValidExecutionStatus } from '../utils/executionStatus';
import { EXECUTION_STATUSES } from '../constants/stringLiterals';
const ExecutionStatusBadge = /*#__PURE__*/ memo(function ExecutionStatusBadge({ status, variant = 'dark', className = '' }) {
    // Explicit check to prevent mutation survivors
    // Use constant to kill StringLiteral mutations
    const normalizedStatus = isValidExecutionStatus(status) === true ? status : EXECUTION_STATUSES.PENDING;
    // Explicit check to prevent mutation survivors
    const colorClasses = variant === 'light' ? getExecutionStatusColorLight(normalizedStatus) : getExecutionStatusColor(normalizedStatus);
    return /*#__PURE__*/ _jsx("div", {
        className: `px-3 py-1 rounded text-sm font-medium ${colorClasses} ${className}`,
        children: normalizedStatus
    });
});
export default ExecutionStatusBadge;
