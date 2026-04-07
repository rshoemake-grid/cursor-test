import styled, { css, keyframes } from "styled-components";
import { colors as c } from "./designTokens";

const pulse = keyframes`
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const statusTone = {
  green: c.green500,
  red: c.red500,
  blue: c.blue500,
  yellow: c.yellow500,
  gray: c.gray500,
};

export const ExecModalStatusIconWrap = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ $tone }) => statusTone[$tone] ?? c.gray500};
  ${({ $pulse }) =>
    $pulse &&
    css`
      animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    `}

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

export const ExecModalRoot = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow-y: auto;
`;

export const ExecModalBackdrop = styled.div.attrs({
  "data-testid": "execution-details-modal-backdrop",
})`
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.5);
  transition: opacity 0.15s ease;
`;

export const ExecModalAlign = styled.div`
  display: flex;
  min-height: 100%;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

export const ExecModalDialog = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 56rem;
  max-height: 90vh;
  overflow: hidden;
  background: ${c.white};
  border-radius: 0.5rem;
  box-shadow:
    0 20px 25px -5px rgb(0 0 0 / 0.1),
    0 8px 10px -6px rgb(0 0 0 / 0.1);
`;

export const ExecModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid ${c.gray200};
`;

export const ExecModalHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const ExecModalTitleBlock = styled.div``;

export const ExecModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 700;
  color: ${c.gray900};
`;

export const ExecModalSubtitle = styled.p`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: ${c.gray500};
  font-family: ui-monospace, monospace;
`;

export const ExecModalIconBtn = styled.button`
  padding: 0.5rem;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  cursor: pointer;
  display: flex;
  color: ${c.gray700};
  transition: background-color 0.15s ease;

  &:hover {
    background: ${c.gray100};
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

export const ExecModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
`;

export const ExecModalBodyStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const ExecModalGrid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const ExecModalFieldLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray500};
`;

export const ExecModalFieldSpacer = styled.div`
  margin-top: 0.25rem;
`;

export const ExecModalMonoText = styled.p`
  margin: 0.25rem 0 0;
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  color: ${c.gray900};
`;

export const ExecModalText = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: ${c.gray900};
`;

export const ExecModalErrorBox = styled.div`
  margin-top: 0.25rem;
  padding: 0.75rem;
  background: ${c.red50};
  border: 1px solid ${c.red200};
  border-radius: 0.5rem;
`;

export const ExecModalErrorText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${c.red800};
`;

export const ExecModalSectionLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray500};
  margin-bottom: 0.5rem;
`;

export const ExecModalNodeStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const ExecModalNodeCard = styled.div`
  padding: 0.75rem;
  background: ${c.gray50};
  border: 1px solid ${c.gray200};
  border-radius: 0.5rem;
`;

export const ExecModalNodeCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
`;

export const ExecModalNodeId = styled.span`
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray900};
`;

export const ExecModalNodeOutput = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: ${c.gray600};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const ExecModalLogsConsole = styled.div`
  background: ${c.gray900};
  color: ${c.green400};
  padding: 1rem;
  border-radius: 0.5rem;
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  line-height: 1rem;
  max-height: 16rem;
  overflow-y: auto;
`;

export const ExecModalLogLine = styled.div`
  margin-bottom: 0.25rem;
`;

export const ExecModalVariablesBox = styled.div`
  background: ${c.gray50};
  border: 1px solid ${c.gray200};
  border-radius: 0.5rem;
  padding: 1rem;
`;

export const ExecModalPre = styled.pre`
  margin: 0;
  font-size: 0.75rem;
  color: ${c.gray700};
  overflow-x: auto;
`;

export const ExecModalFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-top: 1px solid ${c.gray200};
`;

export const ExecModalFooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const ExecModalDownloadPrimary = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  background: ${c.blue600};
  color: ${c.white};
  transition:
    background-color 0.15s ease,
    opacity 0.15s ease;

  &:hover:not(:disabled) {
    background: ${c.blue700};
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

export const ExecModalDownloadSecondary = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  background: ${c.gray600};
  color: ${c.white};
  transition:
    background-color 0.15s ease,
    opacity 0.15s ease;

  &:hover:not(:disabled) {
    background: ${c.gray700};
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

export const ExecModalFooterClose = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  background: ${c.gray100};
  color: ${c.gray700};
  transition: background-color 0.15s ease;

  &:hover {
    background: ${c.gray200};
  }
`;
