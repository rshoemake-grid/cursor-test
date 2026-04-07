import styled from "styled-components";
import { memo } from "react";
import { getLogLevelTone, isValidLogLevel } from "../utils/logLevel";
import { LOG_LEVELS } from "../constants/stringLiterals";
import { colors as c } from "../styles/designTokens";

const LogLevelBadgeRoot = styled.span`
  font-weight: 600;
  ${({ $tone, $showBackground }) => {
    const bgFg = {
      error: { bg: "rgb(127 29 29 / 0.3)", fg: "#fecaca" },
      warning: { bg: "rgb(113 63 18 / 0.3)", fg: "#fef08a" },
      info: { bg: c.gray800, fg: c.gray300 },
      debug: { bg: "rgb(30 58 138 / 0.3)", fg: "#bfdbfe" },
    };
    const textOnly = {
      error: c.red400,
      warning: "#facc15",
      info: c.gray300,
      debug: c.blue400,
    };
    if ($showBackground) {
      const { bg, fg } = bgFg[$tone] || bgFg.info;
      return `
        background: ${bg};
        color: ${fg};
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
      `;
    }
    return `color: ${textOnly[$tone] || textOnly.info};`;
  }}
`;

const LogLevelBadge = memo(function LogLevelBadge2({
  level,
  showBackground = true,
  className = "",
}) {
  const normalizedLevel =
    isValidLogLevel(level) === true ? level : LOG_LEVELS.INFO;
  const tone = getLogLevelTone(normalizedLevel);
  return (
    <LogLevelBadgeRoot
      className={className}
      $tone={tone}
      $showBackground={showBackground === true}
      data-log-tone={tone}
      data-show-background={showBackground === true ? "true" : "false"}
    >
      {normalizedLevel}
    </LogLevelBadgeRoot>
  );
});
export { LogLevelBadge as default };
