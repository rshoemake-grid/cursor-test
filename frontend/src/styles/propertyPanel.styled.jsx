import styled, { css, keyframes } from "styled-components";
import { colors as c } from "./designTokens";

const savePulse = keyframes`
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
`;

const controlFocus = css`
  &:focus {
    outline: none;
    border-color: ${c.primary500};
    box-shadow: 0 0 0 2px ${c.primary200};
  }
`;

export const PropertyPanelPeekWrap = styled.div`
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
`;

export const PropertyPanelPeekBtn = styled.button.attrs({ type: "button" })`
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  border: 1px solid ${c.gray300};
  border-right: none;
  border-radius: 9999px 0 0 9999px;
  background: ${c.white};
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
  cursor: pointer;
  font: inherit;

  &:hover {
    background: ${c.gray100};
  }

  &:focus-visible {
    outline: 2px solid ${c.primary500};
    outline-offset: 2px;
  }
`;

export const PropertyPanelAside = styled.div`
  width: 20rem;
  height: 100%;
  background: ${c.white};
  border-left: 1px solid ${c.gray200};
  padding: 1rem;
  overflow-y: auto;
`;

export const PropertyPanelAsideRelative = styled(PropertyPanelAside)`
  position: relative;
`;

export const PropertyPanelTitle = styled.h3`
  margin: ${({ $compact }) => ($compact ? 0 : "0 0 1rem")};
  font-size: 1.125rem;
  font-weight: 600;
  color: ${c.gray900};
`;

export const PropertyPanelMutedBlock = styled.div`
  font-size: 0.875rem;
  color: ${c.gray500};
  margin-bottom: 0.5rem;
`;

export const PropertyPanelMutedP = styled.p`
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  color: ${c.gray500};
`;

export const PropertyPanelHint = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${c.gray400};
`;

export const PropertyPanelHintSpaced = styled(PropertyPanelHint)`
  margin-top: 0.5rem;
`;

export const PropertyPanelCloseBtn = styled.button.attrs({ type: "button" })`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.25rem;
  border: none;
  background: transparent;
  color: ${c.gray500};
  border-radius: 9999px;
  cursor: pointer;
  display: flex;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${c.gray100};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const PropertyPanelHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

export const PropertyPanelHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const PropertyPanelSaveBtn = styled.button.attrs({ type: "button" })`
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: 0.5rem;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: inherit;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    opacity 0.15s ease;

  svg {
    width: 1rem;
    height: 1rem;
  }

  ${({ $status }) => {
    if ($status === "saved") {
      return css`
        background: ${c.green100};
        color: ${c.green800};
      `;
    }
    if ($status === "saving") {
      return css`
        background: ${c.gray100};
        color: ${c.gray500};
        cursor: not-allowed;
      `;
    }
    return css`
      background: ${c.primary600};
      color: ${c.white};

      &:hover:not(:disabled) {
        background: ${c.primary700};
      }
    `;
  }}
`;

export const PropertyPanelSaveIconPulse = styled.span`
  display: inline-flex;
  animation: ${savePulse} 1.5s ease-in-out infinite;
`;

export const PropertyPanelDeleteBtn = styled.button.attrs({ type: "button" })`
  padding: 0.25rem;
  border: none;
  background: transparent;
  color: ${c.red600};
  border-radius: 0.25rem;
  cursor: pointer;
  display: flex;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${c.red50};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const PropertyPanelStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const PropertyPanelFieldLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray700};
  margin-bottom: 0.25rem;
`;

export const PropertyPanelInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.5rem;
  font: inherit;
  box-sizing: border-box;
  ${controlFocus}
`;

export const PropertyPanelTextarea = styled.textarea`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.5rem;
  font: inherit;
  box-sizing: border-box;
  resize: vertical;
  ${controlFocus}
`;
