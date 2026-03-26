import { jsx as _jsx } from "react/jsx-runtime";
import { memo } from 'react';
import { getLogLevelColor, getLogLevelTextColor, isValidLogLevel } from '../utils/logLevel';
import { LOG_LEVELS } from '../constants/stringLiterals';
const LogLevelBadge = /*#__PURE__*/ memo(function LogLevelBadge({ level, showBackground = true, className = '' }) {
    // Explicit check to prevent mutation survivors
    // Use constant to kill StringLiteral mutations
    const normalizedLevel = isValidLogLevel(level) === true ? level : LOG_LEVELS.INFO;
    // Explicit check to prevent mutation survivors
    const colorClasses = showBackground === true ? getLogLevelColor(normalizedLevel) : '';
    const textColor = getLogLevelTextColor(normalizedLevel);
    return /*#__PURE__*/ _jsx("span", {
        className: `font-semibold ${showBackground ? colorClasses : textColor} ${className}`,
        children: normalizedLevel
    });
});
export default LogLevelBadge;
