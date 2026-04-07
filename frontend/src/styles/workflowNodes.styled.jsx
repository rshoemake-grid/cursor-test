import { Handle } from "@xyflow/react";
import styled, { css } from "styled-components";
import { colors as c } from "./designTokens";

const shadowLg =
  "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)";
const shadowXl =
  "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)";

const borderPalettes = {
  neutral: { def: c.gray300, sel: c.primary500, ring: c.primary200 },
  indigo: { def: c.indigo300, sel: c.indigo500, ring: c.indigo200 },
  purple: { def: c.purple300, sel: c.purple500, ring: c.purple200 },
  blue: { def: c.blue300, sel: c.blue500, ring: c.blue200 },
  orange: { def: c.orange300, sel: c.orange500, ring: c.orange200 },
  yellow: { def: c.yellow300, sel: c.yellow500, ring: c.amber200 },
  green: { def: c.green300, sel: c.green500, ring: c.green200 },
};

const iconPalettes = {
  indigo: { bg: c.indigo100, fg: c.indigo600 },
  purple: { bg: c.purple100, fg: c.purple600 },
  blue: { bg: c.blue100, fg: c.blue600 },
  orange: { bg: c.orange100, fg: c.orange600 },
  yellow: { bg: c.yellow100, fg: c.yellow600 },
  green: { bg: c.green100, fg: c.green600 },
  amber: { bg: c.amber100, fg: c.amber600 },
};

export const WorkflowNodeCard = styled.div.attrs(
  ({ $hasError, $selected }) => ({
    "data-visual-state": $hasError
      ? "error"
      : $selected
        ? "selected"
        : "default",
  }),
)`
  position: relative;
  box-sizing: border-box;
  padding: 12px 16px;
  border-radius: 8px;
  background: ${c.white};
  border-style: solid;
  min-width: ${({ $width }) => $width}px;
  max-width: ${({ $width }) => $width}px;
  ${({ $hasError, $selected, $borderPalette }) => {
    const pal = borderPalettes[$borderPalette] ?? borderPalettes.neutral;
    if ($hasError) {
      return css`
        border-width: 4px;
        border-color: ${c.red500};
        box-shadow: ${shadowXl}, 0 0 0 2px ${c.red200};
      `;
    }
    if ($selected) {
      return css`
        border-width: 4px;
        border-color: ${pal.sel};
        box-shadow: ${shadowXl}, 0 0 0 2px ${pal.ring};
      `;
    }
    return css`
      border-width: 2px;
      border-color: ${pal.def};
      box-shadow: ${shadowLg};
    `;
  }}
`;

export const WorkflowTerminalNode = styled.div.attrs(
  ({ $hasError = false, $selected }) => ({
    "data-visual-state": $hasError
      ? "error"
      : $selected
        ? "selected"
        : "default",
  }),
)`
  position: relative;
  box-sizing: border-box;
  padding: 12px 16px;
  border-radius: 8px;
  border-style: solid;
  ${({ $variant, $selected }) => {
    if ($variant === "start") {
      if ($selected) {
        return css`
          background: linear-gradient(
            to bottom right,
            ${c.primary500},
            ${c.primary600}
          );
          border-width: 4px;
          border-color: ${c.primary700};
          box-shadow: ${shadowXl}, 0 0 0 2px ${c.primary200};
        `;
      }
      return css`
        background: linear-gradient(
          to bottom right,
          ${c.primary500},
          ${c.primary600}
        );
        border-width: 2px;
        border-color: ${c.primary600};
        box-shadow: ${shadowLg};
      `;
    }
    if ($selected) {
      return css`
        background: linear-gradient(
          to bottom right,
          ${c.gray600},
          ${c.gray700}
        );
        border-width: 4px;
        border-color: ${c.gray800};
        box-shadow: ${shadowXl}, 0 0 0 2px ${c.gray300};
      `;
    }
    return css`
      background: linear-gradient(
        to bottom right,
        ${c.gray600},
        ${c.gray700}
      );
      border-width: 2px;
      border-color: ${c.gray700};
      box-shadow: ${shadowLg};
    `;
  }}
`;

export const WNHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

export const WNIconWrap = styled.div`
  padding: 6px;
  border-radius: 4px;
  flex-shrink: 0;
  background: ${({ $palette }) => iconPalettes[$palette]?.bg ?? c.gray100};
  color: ${({ $palette }) => iconPalettes[$palette]?.fg ?? c.gray600};
  display: flex;
  align-items: center;
  justify-content: center;

  & svg {
    width: 16px;
    height: 16px;
  }
`;

export const WNTitle = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: ${c.gray900};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
`;

export const WNDescription = styled.div`
  font-size: 0.75rem;
  line-height: 1rem;
  color: ${c.gray500};
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const WNMetaRow = styled.div`
  font-size: 0.75rem;
  line-height: 1rem;
  color: ${c.gray600};
  background: ${c.gray50};
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const WNMetaHighlight = styled.div`
  font-size: 0.75rem;
  line-height: 1rem;
  color: ${c.blue600};
  background: ${c.blue50};
  padding: 4px 8px;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const WNInlineMuted = styled.span`
  margin-left: 4px;
`;

export const WNBranchSection = styled.div`
  position: relative;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid ${c.gray200};
  min-height: 52px;
`;

export const WNBranchInner = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 4px 4px 4px 0;
`;

export const WNBranchLabelRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const WNBranchLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ $tone }) => ($tone === "true" ? c.green600 : c.red600)};
`;

export const WNTerminalRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${c.white};

  & svg {
    width: 16px;
    height: 16px;
    color: ${c.white};
  }
`;

export const WNTerminalTitle = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: ${c.white};
`;

export const WNHandle = styled(Handle)`
  width: 12px !important;
  height: 12px !important;
  min-width: 12px !important;
  min-height: 12px !important;
`;

export const WNHandleTrue = styled(Handle)`
  width: 12px !important;
  height: 12px !important;
  min-width: 12px !important;
  min-height: 12px !important;
  background: ${c.green500} !important;
  border-color: ${c.green600} !important;
`;

export const WNHandleFalse = styled(Handle)`
  width: 12px !important;
  height: 12px !important;
  min-width: 12px !important;
  min-height: 12px !important;
  background: ${c.red500} !important;
  border-color: ${c.red600} !important;
`;
