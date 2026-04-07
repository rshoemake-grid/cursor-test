import styled from "styled-components";
import { colors as c } from "./designTokens";

const actionBtnBase = `
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.15s ease;

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const MpActionBtnPrimary = styled.button`
  ${actionBtnBase}
  background: ${c.primary600};
  color: ${c.white};

  &:hover {
    background: ${c.primary700};
  }
`;

export const MpActionBtnDanger = styled.button`
  ${actionBtnBase}
  background: ${c.red600};
  color: ${c.white};

  &:hover {
    background: ${c.red700};
  }
`;

export const MpTabButton = styled.button.attrs(({ $active }) => ({
  type: "button",
  "data-active": $active ? "true" : "false",
}))`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  border: none;
  border-bottom: 2px solid
    ${({ $active }) => ($active ? c.primary600 : "transparent")};
  background: transparent;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
  color: ${({ $active }) => ($active ? c.primary600 : c.gray600)};

  &:hover {
    color: ${({ $active }) => ($active ? c.primary600 : c.gray900)};
  }
`;

export const MpTabIconWrap = styled.span.attrs(({ $size }) => ({
  "data-icon-size": $size,
}))`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    width: ${({ $size }) => ($size === "sm" ? "1rem" : "1.25rem")};
    height: ${({ $size }) => ($size === "sm" ? "1rem" : "1.25rem")};
  }
`;
