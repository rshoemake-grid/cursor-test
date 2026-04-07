import styled from "styled-components";
import { colors as c } from "./designTokens";

/** Full-viewport gradient shell for sign-in / password flows */
export const AuthGradientShell = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(to bottom right, ${c.primary50}, ${c.blue100});
`;

export const AuthCard = styled.div`
  width: 100%;
  max-width: 28rem;
  background: ${c.white};
  padding: 2rem;
  border-radius: 1rem;
  box-shadow:
    0 25px 50px -12px rgb(0 0 0 / 0.25),
    0 0 0 1px rgb(0 0 0 / 0.05);
`;

/** Centered heading block: default mb-8, use $compact for mb-6 */
export const AuthHeroBlock = styled.div`
  text-align: center;
  margin-bottom: ${(p) => (p.$compact ? "1.5rem" : "2rem")};
`;

export const AuthHeading1 = styled.h1`
  margin: 0 0 0.5rem;
  font-size: ${(p) => (p.$size === "lg" ? "1.875rem" : "1.5rem")};
  line-height: ${(p) => (p.$size === "lg" ? "2.25rem" : "2rem")};
  font-weight: 700;
  color: ${c.gray900};
`;

export const AuthLead = styled.p`
  margin: 0;
  font-size: 1rem;
  line-height: 1.5rem;
  color: ${c.gray600};
`;

export const AuthFormStack = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const AuthStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const AuthErrorBanner = styled.div`
  background: ${c.red50};
  border: 1px solid ${c.red200};
  color: ${c.red700};
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
`;

export const AuthFieldLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray700};
  margin-bottom: 0.5rem;
`;

export const AuthTextInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 1rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.5rem;
  font: inherit;

  &:focus {
    outline: none;
    border-color: transparent;
    box-shadow: 0 0 0 2px ${c.primary500};
  }
`;

export const AuthPasswordFieldWrap = styled.div`
  position: relative;
`;

export const AuthTextInputWithIconPadding = styled(AuthTextInput)`
  padding-right: 2.5rem;
`;

export const AuthPasswordToggle = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0;
  border: none;
  background: transparent;
  color: ${c.gray500};
  cursor: pointer;

  &:hover {
    color: ${c.gray700};
  }

  &:focus {
    outline: none;
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
    display: block;
  }
`;

export const AuthPrimaryButton = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: ${c.primary600};
  color: ${c.white};
  font-weight: 600;
  font: inherit;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover:not(:disabled) {
    background: ${c.primary700};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px ${c.white}, 0 0 0 4px ${c.primary500};
  }
`;

export const AuthLinkRow = styled.div`
  margin-top: 1.5rem;
  text-align: center;
`;

export const AuthModeToggle = styled.button`
  border: none;
  background: transparent;
  color: ${c.primary600};
  font-weight: 500;
  font: inherit;
  cursor: pointer;

  &:hover {
    color: ${c.primary700};
  }
`;

export const AuthGhostLink = styled.button`
  border: none;
  background: transparent;
  color: ${c.gray600};
  font-size: 0.875rem;
  font: inherit;
  cursor: pointer;

  &:hover {
    color: ${c.gray700};
  }
`;

export const AuthBackNavButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 0;
  border: none;
  background: transparent;
  font: inherit;
  cursor: pointer;
  color: ${c.gray600};

  &:hover {
    color: ${c.gray700};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const AuthRememberRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const AuthCheckboxRow = styled.div`
  display: flex;
  align-items: center;
`;

export const AuthCheckbox = styled.input`
  width: 1rem;
  height: 1rem;
  color: ${c.primary600};
  border-radius: 0.25rem;
  border-color: ${c.gray300};

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${c.primary500};
  }
`;

export const AuthCheckboxLabel = styled.label`
  margin-left: 0.5rem;
  font-size: 0.875rem;
  color: ${c.gray700};
`;

export const AuthInlineLinkButton = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  font-size: 0.875rem;
  color: ${c.primary600};
  cursor: pointer;
  font: inherit;

  &:hover {
    color: ${c.primary700};
  }
`;

export const AuthSuccessIconCircle = styled.div`
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1rem;
  border-radius: 9999px;
  background: ${c.green100};
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 2rem;
    height: 2rem;
    color: ${c.green600};
  }
`;

export const AuthDevTokenPanel = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: ${c.blue50};
  border: 1px solid ${c.blue200};
  border-radius: 0.5rem;
`;

export const AuthDevTokenTitle = styled.p`
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${c.blue800};
`;

export const AuthDevTokenHint = styled.p`
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  color: ${c.blue700};
`;

export const AuthDevTokenCode = styled.code`
  display: block;
  font-size: 0.75rem;
  background: ${c.white};
  padding: 0.5rem;
  border-radius: 0.25rem;
  word-break: break-all;
`;

export const AuthDevTokenLink = styled.button`
  margin-top: 0.75rem;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 0.875rem;
  color: ${c.blue600};
  text-decoration: underline;
  cursor: pointer;
  font: inherit;

  &:hover {
    color: ${c.blue700};
  }
`;
