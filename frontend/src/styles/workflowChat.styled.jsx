import styled, { keyframes, css } from "styled-components";
import { colors as c } from "./designTokens";

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const pulse = keyframes`
  50% {
    opacity: 0.65;
  }
`;

export const ChatRoot = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${c.gray900};
  color: ${c.gray100};
`;

export const ChatToolbar = styled.div`
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid ${c.gray800};
`;

export const ChatIconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid ${c.gray700};
  background: ${c.gray800};
  color: ${c.gray200};
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    opacity 0.15s ease;

  &:hover:not(:disabled) {
    background: ${c.gray700};
    border-color: ${c.gray600};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const ChatMessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const ChatMessageRow = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: ${(p) => (p.$align === "end" ? "flex-end" : "flex-start")};
`;

export const ChatAvatar = styled.div`
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => (p.$variant === "user" ? c.gray700 : c.blue600)};
  color: ${c.white};
`;

export const ChatBubble = styled.div`
  max-width: 80%;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${(p) => (p.$variant === "user" ? c.blue600 : c.gray800)};
  color: ${(p) => (p.$variant === "user" ? c.white : c.gray100)};
`;

export const ChatBubbleText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  white-space: pre-wrap;
`;

export const ChatTypingBubble = styled.div`
  background: ${c.gray800};
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
`;

export const ChatSpinnerIcon = styled.span`
  display: inline-flex;
  animation: ${spin} 1s linear infinite;
`;

export const ChatComposer = styled.div`
  border-top: 1px solid ${c.gray800};
  padding: 1rem;
`;

export const ChatSignInHint = styled.p`
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: ${c.gray400};
`;

export const ChatAuthLink = styled.a`
  color: ${c.blue400};
  text-decoration: underline;

  &:hover {
    color: ${c.blue300};
  }
`;

export const ChatComposerRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
`;

export const ChatTextarea = styled.textarea`
  flex: 1;
  min-height: 4.5rem;
  resize: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  font: inherit;
  color: ${c.gray100};
  background: ${c.gray800};

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${c.blue500};
  }

  &:disabled {
    opacity: 0.5;
  }
`;

export const ChatControlCluster = styled.div`
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
  align-items: flex-end;
`;

export const ChatIterationWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-shrink: 0;
  justify-content: flex-end;
  padding-bottom: 0.125rem;
`;

export const ChatIterationLabel = styled.label`
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${c.gray500};
  white-space: nowrap;
`;

export const ChatIterationInput = styled.input`
  width: 4rem;
  box-sizing: border-box;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: ${c.gray100};
  background: ${c.gray800};
  border: 1px solid ${c.gray700};
  border-radius: 0.5rem;
  font: inherit;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  appearance: textfield;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${c.blue500};
  }

  &:disabled {
    opacity: 0.5;
  }
`;

export const ChatMicButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid ${c.gray700};
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    opacity 0.15s ease;

  ${(p) =>
    p.$listening
      ? css`
          background: rgb(127 29 29 / 0.5);
          border-color: ${c.red500};
          color: ${c.red200};
        `
      : css`
          background: ${c.gray800};
          color: ${c.gray200};

          &:hover:not(:disabled) {
            background: ${c.gray700};
          }
        `}

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const ChatMicIcon = styled.span`
  display: inline-flex;
  ${(p) =>
    p.$pulse &&
    css`
      animation: ${pulse} 2s ease-in-out infinite;
    `}
`;

export const ChatTtsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    opacity 0.15s ease;

  ${(p) =>
    p.$active
      ? css`
          background: ${c.violet700};
          border: 1px solid ${c.violet500};
          color: ${c.white};
        `
      : css`
          background: ${c.gray800};
          border: 1px solid ${c.gray700};
          color: ${c.gray200};

          &:hover:not(:disabled) {
            background: ${c.gray700};
          }
        `}

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const ChatSendButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font: inherit;
  cursor: pointer;
  color: ${c.white};
  background: ${c.blue600};
  transition:
    background 0.15s ease,
    opacity 0.15s ease;

  &:hover:not(:disabled) {
    background: ${c.blue700};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
