import styled from "styled-components";
import { AlertCircle } from "lucide-react";
import { colors as c } from "../styles/designTokens";
import { CenteredScreenPanel } from "../styles/pageLayout.styled";

export const ErrorFallbackShell = styled(CenteredScreenPanel)``;

export const ErrorCard = styled.div`
  max-width: 42rem;
  width: 100%;
  background: ${c.white};
  border-radius: 0.5rem;
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
  border: 1px solid ${c.gray200};
  padding: 2rem;
`;

export const ErrorHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

export const ErrorAlertIcon = styled(AlertCircle)`
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  color: ${c.red500};
`;

export const ErrorHeading = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 700;
  color: ${c.gray900};
`;

export const ErrorLead = styled.p`
  margin: 0 0 1.5rem;
  color: ${c.gray600};
`;

export const ErrorDetailsPanel = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: ${c.red50};
  border: 1px solid ${c.red200};
  border-radius: 0.5rem;
`;

export const ErrorDetailsLabel = styled.p`
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.red800};
`;

export const ErrorDetailsMessage = styled.p`
  margin: 0;
  font-size: 0.875rem;
  font-family: ui-monospace, monospace;
  color: ${c.red700};
`;

export const ErrorStackDetails = styled.details`
  margin-top: 1rem;
`;

export const ErrorStackSummary = styled.summary`
  font-size: 0.875rem;
  color: ${c.red700};
  cursor: pointer;
`;

export const ErrorStackPre = styled.pre`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: ${c.red600};
  overflow: auto;
`;

export const ErrorActionsRow = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const buttonBase = `
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font: inherit;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const ErrorPrimaryButton = styled.button`
  ${buttonBase};
  background: ${c.primary600};
  color: ${c.white};

  &:hover {
    background: ${c.primary700};
  }
`;

export const ErrorSecondaryButton = styled.button`
  ${buttonBase};
  background: ${c.gray200};
  color: ${c.gray700};

  &:hover {
    background: ${c.gray300};
  }
`;
