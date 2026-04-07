import styled from "styled-components";
import { colors as c } from "./designTokens";

/** Tailwind-aligned dark chips (bg-*-900 text-*-200) */
const darkSkin = {
  completed: { bg: "#14532d", fg: "#bbf7d7" },
  failed: { bg: "#7f1d1d", fg: "#fecaca" },
  running: { bg: "#1e3a8a", fg: "#bfdbfe" },
  pending: { bg: "#713f12", fg: "#fef08a" },
  paused: { bg: c.gray900, fg: c.gray200 },
};

/** Tailwind-aligned light chips (bg-*-100 text-*-800) */
const lightSkin = {
  completed: { bg: c.green100, fg: c.green800 },
  failed: { bg: c.red100, fg: c.red800 },
  running: { bg: c.blue100, fg: c.blue800 },
  pending: { bg: c.yellow100, fg: c.yellow800 },
  paused: { bg: c.gray100, fg: c.gray800 },
};

export const ExecutionStatusBadgeRoot = styled.div.attrs((p) => ({
  "data-execution-status": p.$status,
  "data-variant": p.$variant,
}))`
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  text-transform: lowercase;
  background: ${({ $variant, $status }) => {
    const skin = $variant === "light" ? lightSkin : darkSkin;
    return skin[$status]?.bg || skin.paused.bg;
  }};
  color: ${({ $variant, $status }) => {
    const skin = $variant === "light" ? lightSkin : darkSkin;
    return skin[$status]?.fg || skin.paused.fg;
  }};
`;

/** Rounded pill + flex row (ExecutionViewer header) */
export const ExecutionStatusPill = styled.div.attrs((p) => ({
  "data-execution-status": p.$status,
}))`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  background: ${({ $status }) =>
    lightSkin[$status]?.bg || lightSkin.paused.bg};
  color: ${({ $status }) =>
    lightSkin[$status]?.fg || lightSkin.paused.fg};
`;

/** Compact light chip for node rows */
export const ExecutionStatusMiniChip = styled.span.attrs((p) => ({
  "data-execution-status": p.$status,
}))`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 500;
  text-transform: lowercase;
  background: ${({ $status }) =>
    lightSkin[$status]?.bg || lightSkin.paused.bg};
  color: ${({ $status }) =>
    lightSkin[$status]?.fg || lightSkin.paused.fg};
`;
