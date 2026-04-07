import styled, { css } from "styled-components";
import { colors as c } from "./designTokens";

const focusRing = css`
  &:focus {
    outline: none;
    border-color: ${c.primary500};
    box-shadow: 0 0 0 2px ${c.primary200};
  }
`;

export const PublishModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 0.4);
`;

export const PublishModalForm = styled.form`
  background: ${c.white};
  border-radius: 0.75rem;
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
  max-width: 28rem;
  width: 100%;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const PublishModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const PublishModalTitle = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${c.gray900};
`;

export const PublishModalCloseIcon = styled.button.attrs({ type: "button" })`
  padding: 0;
  border: none;
  background: transparent;
  color: ${c.gray500};
  cursor: pointer;
  display: flex;
  transition: color 0.15s ease;

  &:hover {
    color: ${c.gray700};
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

export const PublishModalField = styled.div``;

export const PublishModalLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray700};
  margin-bottom: 0.25rem;
`;

export const PublishModalInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.5rem;
  font: inherit;
  box-sizing: border-box;
  ${focusRing}
`;

export const PublishModalTextarea = styled.textarea`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.5rem;
  font: inherit;
  box-sizing: border-box;
  resize: vertical;
  ${focusRing}
`;

export const PublishModalSelect = styled.select`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.5rem;
  font: inherit;
  background: ${c.white};
  box-sizing: border-box;
  ${focusRing}
`;

export const PublishModalRow = styled.div`
  display: flex;
  gap: 1rem;
`;

export const PublishModalRowCol = styled.div`
  flex: 1;
  min-width: 0;
`;

export const PublishModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

export const PublishModalCancelBtn = styled.button.attrs({ type: "button" })`
  padding: 0.5rem 1rem;
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

export const PublishModalSubmitBtn = styled.button.attrs({ type: "submit" })`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: ${c.blue600};
  color: ${c.white};
  font: inherit;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    opacity 0.15s ease;

  &:hover:not(:disabled) {
    background: ${c.blue700};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
