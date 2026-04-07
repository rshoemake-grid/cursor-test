import styled from "styled-components";
import { colors as c } from "./designTokens";

const iconTones = {
  primary: c.primary600,
  purple: "#9333ea",
  green: c.green600,
  gray: c.gray600,
  blue: c.blue600,
  indigo: "#4f46e5",
  amber: c.amber700,
  orange: "#ea580c",
  yellow: "#ca8a04",
};

export const NodePanelRoot = styled.div`
  width: 16rem;
  height: 100%;
  background: ${c.white};
  border-right: 1px solid ${c.gray200};
  padding: 1rem;
  overflow-y: auto;
`;

export const NodePanelTitle = styled.h3`
  margin: 0 0 1rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${c.gray900};
`;

export const NodePanelSubtitle = styled.p`
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: ${c.gray600};
`;

export const NodePanelSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const NodePanelSectionSpaced = styled(NodePanelSection)`
  margin-top: 1.5rem;
`;

export const NodePanelCategoryBtn = styled.button.attrs({ type: "button" })`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font: inherit;
  transition: color 0.15s ease;
  color: ${({ $muted }) => ($muted ? c.gray500 : c.gray700)};

  &:hover {
    color: ${({ $muted }) => ($muted ? c.gray700 : c.gray900)};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const NodePaletteIconWrap = styled.span`
  display: inline-flex;
  color: ${({ $tone }) => iconTones[$tone] ?? c.gray600};

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const NodePanelPaletteCard = styled.div`
  padding: 0.75rem;
  border: 2px solid ${c.gray200};
  border-radius: 0.5rem;
  cursor: move;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;

  &:hover {
    border-color: ${({ $variant }) =>
      $variant === "tool" ? "#fbbf24" : c.primary500};
    background: ${({ $variant }) =>
      $variant === "tool" ? c.amber50 : c.primary50};
  }
`;

export const NodePanelCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

export const NodePanelCardTitle = styled.span`
  font-weight: 500;
  font-size: 0.875rem;
  color: ${c.gray900};
`;

export const NodePanelCardDesc = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${({ $muted }) => ($muted ? c.gray500 : c.gray600)};
`;

export const NodePanelHiddenInput = styled.input`
  display: none;
`;

export const NodePanelImportBtn = styled.button.attrs({ type: "button" })`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px dashed ${c.gray300};
  border-radius: 0.5rem;
  font-size: 0.75rem;
  color: ${c.gray600};
  background: transparent;
  cursor: pointer;
  font: inherit;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    border-color: ${({ $variant }) =>
      $variant === "tool" ? "#fbbf24" : c.primary500};
    background: ${({ $variant }) =>
      $variant === "tool" ? c.amber50 : c.primary50};
    color: ${({ $variant }) =>
      $variant === "tool" ? c.amber900 : c.primary700};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const NodePanelTipBox = styled.div`
  margin-top: 1.5rem;
  padding: 0.75rem;
  background: ${c.blue50};
  border-radius: 0.5rem;
`;

export const NodePanelTipTitle = styled.h4`
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${c.blue900};
`;

export const NodePanelTipText = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${c.blue700};
`;
