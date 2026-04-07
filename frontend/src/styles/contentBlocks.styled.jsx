import styled, { keyframes } from "styled-components";
import { colors as c } from "./designTokens";

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

/** Centered empty / loading copy: e.g. py-12 text-center */
export const EmptyStateCentered = styled.div`
  text-align: center;
  padding: 3rem 1rem;
`;

/** Muted empty state (gray-400) with vertical padding */
export const EmptyStateMuted = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  color: ${(p) => (p.$variant === "lighter" ? c.gray400 : c.gray600)};
`;

/** White card empty panel (Log page list area) */
export const PanelEmptyCard = styled.div`
  text-align: center;
  padding: 3rem;
  background: ${c.white};
  border-radius: 0.5rem;
  border: 1px solid ${c.gray200};
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
`;

/** Workflow list / tabs empty column */
export const WorkflowEmptyColumn = styled.div`
  text-align: center;
  padding: 2rem 1rem;
`;

/** Centered copy only (parent handles flex centering) */
export const EmptyStateInlineCenter = styled.div`
  text-align: center;
`;

export const EmptyStateParagraph = styled.p`
  margin: 0;
  color: ${c.gray600};
`;

export const EmptyStateLead = styled.p`
  margin: 0 0 1rem;
  color: ${c.gray500};
`;

export const EmptyStateHint = styled.p`
  margin: ${(p) => (p.$tight ? "0" : "0 0 1rem")};
  font-size: 0.875rem;
  color: ${c.gray400};
`;

export const EmptyStateBelowSpinner = styled.p`
  margin: 1rem 0 0;
  color: ${c.gray600};
`;

export const MarketplaceLoadingSpinner = styled.div`
  display: inline-block;
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  border: 2px solid transparent;
  border-bottom-color: ${c.primary600};
  animation: ${spin} 1s linear infinite;
`;

export const EmptyStatePrimaryCta = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-left: auto;
  margin-right: auto;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: ${c.primary600};
  color: ${c.white};
  font: inherit;
  cursor: pointer;

  &:hover {
    background: ${c.primary700};
  }
`;

export const EmptyStateOutlineCta = styled.button`
  display: block;
  margin: 0 auto 0.75rem;
  padding: 0.5rem 1rem;
  background: ${c.white};
  border: 1px solid ${c.gray300};
  color: ${c.gray800};
  border-radius: 0.5rem;
  font: inherit;
  cursor: pointer;

  &:hover {
    background: ${c.gray50};
  }
`;

export const PanelEmptyIconWrap = styled.div`
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  color: ${c.gray400};

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
`;

export const PanelEmptyTitle = styled.p`
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  font-weight: 500;
  color: ${c.gray900};
`;

export const PanelEmptySubtitle = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${c.gray600};
`;

/** Dark console / execution log empty rows */
export const ConsoleEmptyState = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  color: ${(p) => (p.$tone === "soft" ? c.gray500 : c.gray400)};
`;

export const ExecutionLogEmptyBlock = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  color: ${c.gray400};
`;

export const DarkEmptyIconWrap = styled.div`
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  opacity: 0.5;

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
`;

export const DarkEmptyTitle = styled.p`
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  font-weight: 500;
`;

export const DarkEmptySubtitle = styled.p`
  margin: 0;
  font-size: 0.875rem;
`;
