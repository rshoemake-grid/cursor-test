import styled, { css } from "styled-components";
import { colors as c } from "./designTokens";

const focusRing = css`
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px ${c.white}, 0 0 0 4px ${c.primary500};
  }
`;

const focusRingAmber = css`
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px ${c.white}, 0 0 0 4px ${c.amber700};
  }
`;

const focusRingGreen = css`
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px ${c.white}, 0 0 0 4px ${c.green600};
  }
`;

const focusRingBlue = css`
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px ${c.white}, 0 0 0 4px ${c.blue600};
  }
`;

export const TabBarRoot = styled.div`
  display: flex;
  align-items: center;
  background: ${c.gray100};
  border-bottom: 1px solid ${c.gray300};
  padding: 0 0.5rem;
`;

export const TabBarScroll = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  overflow-x: auto;
`;

export const TabBarTabBtn = styled.button.attrs(({ $active }) => ({
  type: "button",
  "data-active": $active ? "true" : "false",
}))`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-right: 1px solid ${c.gray300};
  border-top: none;
  border-bottom: none;
  border-left: none;
  position: relative;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: background-color 0.15s ease, color 0.15s ease;
  background: ${({ $active }) => ($active ? c.white : c.gray100)};
  color: ${({ $active }) => ($active ? c.gray900 : c.gray600)};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};

  &:hover {
    background: ${({ $active }) => ($active ? c.white : c.gray200)};
  }

  &:hover [data-tab-close="true"] {
    opacity: 1;
  }
`;

export const TabBarUnsavedDot = styled.div.attrs({
  title: "Unsaved changes",
  "data-testid": "tab-unsaved-indicator",
})`
  width: 0.5rem;
  height: 0.5rem;
  background: ${c.blue500};
  border-radius: 50%;
  flex-shrink: 0;
`;

export const TabBarTabLabel = styled.span`
  font-size: 0.875rem;
  white-space: nowrap;
`;

export const TabBarRenameInput = styled.input`
  width: 100%;
  font-size: 0.875rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid ${c.blue400};
  outline: none;
  font: inherit;

  &:focus {
    border-bottom-color: ${c.blue500};
  }
`;

export const TabBarCloseTab = styled.div.attrs({
  role: "button",
  tabIndex: 0,
  "data-tab-close": "true",
  title: "Close tab",
})`
  opacity: 0;
  border-radius: 0.125rem;
  padding: 0.125rem;
  transition: opacity 0.15s ease, background-color 0.15s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${c.gray300};
  }

  svg {
    width: 0.75rem;
    height: 0.75rem;
  }
`;

export const TabBarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const TabBarGhostBtn = styled.button`
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid ${c.gray300};
  background: ${c.white};
  color: ${c.gray700};
  font-size: 0.875rem;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s ease;
  ${focusRing}

  &:hover {
    background: ${c.gray50};
  }
`;

export const TabBarClearBtn = styled.button`
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid ${c.amber200};
  background: ${c.amber50};
  color: ${c.amber900};
  font-size: 0.875rem;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s ease;
  ${focusRingAmber}

  &:hover {
    background: #fef3c7;
  }
`;

export const TabBarExecuteBtn = styled.button`
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  border: none;
  background: ${c.green600};
  color: ${c.white};
  font-size: 0.875rem;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s ease;
  ${focusRingGreen}

  &:hover {
    background: ${c.green800};
  }
`;

export const TabBarPublishBtn = styled.button`
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  border: none;
  background: ${c.blue600};
  color: ${c.white};
  font-size: 0.875rem;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s ease;
  ${focusRingBlue}

  &:hover {
    background: ${c.blue700};
  }
`;

export const TabBarNewBtn = styled.button.attrs({ type: "button" })`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: ${c.gray600};
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${c.gray200};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const TabBarNewLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
`;
