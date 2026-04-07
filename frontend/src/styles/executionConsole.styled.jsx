import styled, { keyframes, css } from "styled-components";
import { colors as c } from "./designTokens";

const pulseOpacity = keyframes`
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
`;

const pulseDot = keyframes`
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

export const ConsoleRoot = styled.div`
  position: relative;
  width: 100%;
  flex-shrink: 0;
  background: ${c.gray900};
  color: ${c.gray100};
  box-shadow: 0 -25px 50px -12px rgb(0 0 0 / 0.25);
  border-top: 2px solid ${c.gray700};
`;

export const ConsoleResizeHandle = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  cursor: ns-resize;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${c.blue500};
  }
`;

export const ConsoleTabBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid ${c.gray800};
  background: ${c.gray800};
`;

export const ConsoleTabScroll = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  flex: 1;
  min-width: 0;
`;

export const ConsoleTabCluster = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  position: relative;
  transition: background-color 0.15s ease, color 0.15s ease;

  ${({ $active }) =>
    $active
      ? `
    background: ${c.gray700};
    color: ${c.white};
  `
      : `
    color: ${c.gray400};
    &:hover {
      color: ${c.white};
      background: ${c.gray700};
    }
  `}
`;

export const ConsoleTabButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0;
  border: none;
  background: transparent;
  font: inherit;
  color: inherit;
  cursor: pointer;

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const ConsoleTabLabel = styled.span`
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.25rem;
  white-space: nowrap;
`;

export const ConsoleStatusDot = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: ${({ $variant }) =>
    $variant === "failed" ? c.red500 : c.green500};
  ${({ $pulse }) =>
    $pulse &&
    css`
      animation: ${pulseDot} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    `}
`;

export const ConsoleTabClose = styled.button`
  margin-left: 0.25rem;
  padding: 2px;
  border: none;
  border-radius: 0.25rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, background-color 0.15s ease;

  ${ConsoleTabCluster}:hover & {
    opacity: 1;
  }

  &:hover {
    background: ${c.gray600};
  }

  svg {
    width: 0.75rem;
    height: 0.75rem;
  }
`;

export const ConsoleExpandToggle = styled.button`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: ${c.gray400};
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: ${c.white};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const ConsoleTabBarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

export const ConsoleBody = styled.div`
  overflow: hidden;
`;

export const ConsoleLogScroll = styled.div`
  height: 100%;
  overflow-y: auto;
  background: ${c.gray900};
  color: ${c.gray100};
  padding: 1rem;
`;

export const ConsoleLogStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const ConsoleLogHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ConsoleLogTitle = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 600;
`;

export const ConsoleLogMeta = styled.p`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: ${c.gray400};
`;

export const ConsoleLogEntries = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  line-height: 1rem;
`;

export const ConsoleLogEntry = styled.div`
  padding: 0.5rem;
  border-radius: 0.25rem;
  background: ${({ $tone }) => {
    switch ($tone) {
      case "error":
        return "rgb(127 29 29 / 0.3)";
      case "warning":
        return "rgb(113 63 18 / 0.3)";
      case "debug":
        return "rgb(30 58 138 / 0.3)";
      case "info":
      default:
        return c.gray800;
    }
  }};
  color: ${({ $tone }) => {
    switch ($tone) {
      case "error":
        return "#fecaca";
      case "warning":
        return "#fef08a";
      case "debug":
        return "#bfdbfe";
      case "info":
      default:
        return c.gray300;
    }
  }};
`;

export const ConsoleLogTime = styled.span`
  color: ${c.gray500};
`;

export const ConsoleLogNodeRef = styled.span`
  color: ${c.gray500};
`;

/** Execution log tab (dark) */
export const ExecLogScroll = styled.div`
  height: 100%;
  overflow-y: auto;
  background: ${c.gray900};
  color: ${c.gray100};
  padding: 1rem;
`;

export const ExecLogInner = styled.div`
  height: 100%;
  overflow-y: auto;
  background: ${c.gray900};
  color: ${c.gray100};
`;

export const ExecLogPad = styled.div`
  padding: 1rem;
`;

export const ExecLogHeaderBlock = styled.div`
  margin-bottom: 1rem;
`;

export const ExecLogTitle = styled.h3`
  margin: 0 0 0.25rem;
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 600;
  color: ${c.white};
`;

export const ExecLogSubtitle = styled.p`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: ${c.gray400};
`;

export const ExecLogCardStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const ExecLogCard = styled.div`
  background: ${c.gray800};
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid ${({ $active }) => ($active ? c.blue500 : c.gray700)};
  transition: border-color 0.15s ease, background-color 0.15s ease;
  cursor: pointer;

  &:hover {
    border-color: ${({ $active }) => ($active ? c.blue400 : c.gray600)};
    background: ${c.gray700};
  }
`;

export const ExecLogCardRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`;

export const ExecLogCardMain = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ExecLogIdRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

export const ExecLogMono = styled.span`
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: ${c.gray300};
`;

export const ExecLogNodeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

export const ExecLogNodeLabel = styled.span`
  font-size: 0.75rem;
  line-height: 1rem;
  color: ${c.gray500};
`;

export const ExecLogNodeValue = styled.span`
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  color: ${c.gray300};
`;

export const ExecLogProgressBlock = styled.div`
  margin-bottom: 0.5rem;
`;

export const ExecLogProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
  color: ${c.gray400};
`;

export const ExecLogProgressTrack = styled.div`
  flex: 1;
  background: ${c.gray700};
  border-radius: 9999px;
  height: 6px;
  overflow: hidden;
`;

export const ExecLogProgressFill = styled.div`
  background: ${c.blue500};
  height: 100%;
  transition: width 0.3s ease;
`;

export const ExecLogMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
  line-height: 1rem;
  color: ${c.gray500};
`;

export const ExecLogMetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;

  svg {
    width: 0.75rem;
    height: 0.75rem;
    flex-shrink: 0;
  }
`;

export const ExecLogMetaMuted = styled.div`
  color: ${c.gray600};
  white-space: nowrap;
`;

export const ExecLogCardAside = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;
`;

export const ExecLogStatusDone = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${c.green400};
`;

export const ExecLogStatusFail = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${c.red400};
`;

export const ExecLogStatusActive = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${c.blue400};
  ${css`
    animation: ${pulseOpacity} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  `}
`;

/** Lucide icon sizing + color for execution status (shared with executionFormat) */
export const ExecStatusIconWrap = styled.span.attrs((p) => ({
  "data-exec-status": p.$status ?? "default",
  "data-pulse": p.$pulse ? "true" : "false",
}))`
  display: inline-flex;
  flex-shrink: 0;

  svg {
    width: 1rem;
    height: 1rem;
    color: ${({ $status }) => {
      switch ($status) {
        case "completed":
          return c.green500;
        case "failed":
          return c.red500;
        case "running":
          return c.blue500;
        case "pending":
          return c.yellow500;
        case "default":
        default:
          return c.gray500;
      }
    }};
    ${({ $pulse }) =>
      $pulse &&
      css`
        animation: ${pulseOpacity} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      `}
  }
`;
