import { memo } from "react";
import {
  getLogLevelColor,
  getLogLevelTextColor,
  isValidLogLevel,
} from "../utils/logLevel";
import { LOG_LEVELS } from "../constants/stringLiterals";
const LogLevelBadge = memo(function LogLevelBadge2({
  level,
  showBackground = true,
  className = "",
}) {
  const normalizedLevel =
    isValidLogLevel(level) === true ? level : LOG_LEVELS.INFO;
  const colorClasses =
    showBackground === true ? getLogLevelColor(normalizedLevel) : "";
  const textColor = getLogLevelTextColor(normalizedLevel);
  return (
    <span
      className={`font-semibold ${showBackground ? colorClasses : textColor} ${className}`}
    >
      {normalizedLevel}
    </span>
  );
});
var stdin_default = LogLevelBadge;
export { stdin_default as default };
