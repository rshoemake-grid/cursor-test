import styled from "styled-components";
import { colors as c } from "./designTokens";

export const CtxMenuRoot = styled.div.attrs({
  "data-testid": "node-context-menu",
})`
  position: fixed;
  z-index: 50;
  min-width: 180px;
  background: ${c.white};
  border: 1px solid ${c.gray200};
  border-radius: 0.5rem;
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
  padding: 0.25rem 0;
`;

const menuItemBase = `
  width: 100%;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 0.875rem;
  color: ${c.gray700};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font: inherit;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${c.gray50};
  }

  svg {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }
`;

export const CtxMenuItem = styled.button.attrs({ type: "button" })`
  ${menuItemBase}
`;

export const CtxMenuItemSection = styled.button.attrs({ type: "button" })`
  ${menuItemBase}
  border-top: 1px solid ${c.gray200};
  margin-top: 0.25rem;
  padding-top: 0.5rem;
`;

export const CtxMenuDivider = styled.div`
  border-top: 1px solid ${c.gray200};
  margin: 0.25rem 0;
`;

export const CtxMenuDangerItem = styled.button.attrs({ type: "button" })`
  width: 100%;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 0.875rem;
  color: ${c.red600};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font: inherit;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${c.red50};
  }

  svg {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }
`;
