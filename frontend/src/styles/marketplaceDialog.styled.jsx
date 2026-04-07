import styled, { css, keyframes } from "styled-components";
import { colors as c } from "./designTokens";

const focusRing = css`
  &:focus {
    outline: none;
    border-color: ${c.primary500};
    box-shadow: 0 0 0 2px ${c.primary200};
  }
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

export const MPDOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const MPDBackdrop = styled.div.attrs({
  "data-testid": "marketplace-dialog-backdrop",
})`
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 0.5);
`;

export const MPDDialog = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 42rem;
  max-height: 90vh;
  overflow: hidden;
  background: ${c.white};
  border-radius: 0.5rem;
  box-shadow:
    0 20px 25px -5px rgb(0 0 0 / 0.1),
    0 8px 10px -6px rgb(0 0 0 / 0.1);
`;

export const MPDHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid ${c.gray200};
`;

export const MPDTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${c.gray900};
`;

export const MPDCloseBtn = styled.button.attrs({ type: "button" })`
  padding: 0;
  border: none;
  background: transparent;
  color: ${c.gray400};
  cursor: pointer;
  display: flex;
  transition: color 0.15s ease;

  &:hover {
    color: ${c.gray600};
  }

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`;

export const MPDTabsRow = styled.div`
  display: flex;
  border-bottom: 1px solid ${c.gray200};
`;

export const MPDTabBtn = styled.button.attrs(({ $active }) => ({
  type: "button",
  "data-active": $active ? "true" : "false",
}))`
  flex: 1;
  padding: 1rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  border: none;
  border-bottom: 2px solid
    ${({ $active }) => ($active ? c.primary600 : "transparent")};
  background: ${({ $active }) => ($active ? c.primary50 : "transparent")};
  color: ${({ $active }) => ($active ? c.primary600 : c.gray600)};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition:
    color 0.15s ease,
    background-color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    color: ${({ $active }) => ($active ? c.primary600 : c.gray900)};
    background: ${({ $active }) => ($active ? c.primary50 : c.gray50)};
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

export const MPDBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
`;

export const MPDStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const MPDField = styled.div``;

export const MPDLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray700};
  margin-bottom: 0.5rem;
`;

export const MPDInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.5rem;
  font: inherit;
  box-sizing: border-box;
  ${focusRing}
`;

export const MPDInputReadonly = styled(MPDInput)`
  background: ${c.gray50};
`;

export const MPDTextarea = styled.textarea`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.5rem;
  font: inherit;
  box-sizing: border-box;
  resize: vertical;
  ${focusRing}
`;

export const MPDSelect = styled.select`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.5rem;
  font: inherit;
  background: ${c.white};
  box-sizing: border-box;
  ${focusRing}
`;

export const MPDHint = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: ${c.gray500};
`;

export const MPDGrid2 = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`;

export const MPDFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid ${c.gray200};
  background: ${c.gray50};
`;

export const MPDCancelBtn = styled.button.attrs({ type: "button" })`
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.5rem;
  background: ${c.white};
  color: ${c.gray700};
  font: inherit;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${c.gray50};
  }
`;

export const MPDPublishBtn = styled.button.attrs({ type: "button" })`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border: none;
  border-radius: 0.5rem;
  background: ${c.primary600};
  color: ${c.white};
  font: inherit;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    opacity 0.15s ease;

  &:hover:not(:disabled) {
    background: ${c.primary700};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const MPDSpinner = styled.div`
  width: 1rem;
  height: 1rem;
  border: 2px solid ${c.white};
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${spin} 0.65s linear infinite;
`;
