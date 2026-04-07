import styled from "styled-components";
import { colors as c } from "./designTokens";

export const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 0.5);
`;

export const ModalPanel = styled.div`
  width: 100%;
  background: ${c.white};
  border-radius: 0.5rem;
  box-shadow:
    0 25px 50px -12px rgb(0 0 0 / 0.25),
    0 0 0 1px rgb(0 0 0 / 0.05);
  max-height: ${(p) => (p.$tall ? "90vh" : "none")};
  overflow-y: ${(p) => (p.$tall ? "auto" : "visible")};
  max-width: ${(p) => (p.$wide ? "42rem" : "24rem")};
  margin: ${(p) => (p.$wide ? "0 1rem" : "0")};
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid ${c.gray200};
`;

export const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${c.gray900};
`;

export const ModalCloseButton = styled.button`
  padding: 0;
  border: none;
  background: transparent;
  color: ${c.gray400};
  cursor: pointer;
  line-height: 0;
  transition: color 0.15s ease;

  &:hover {
    color: ${c.gray600};
  }
`;

export const ModalBody = styled.div`
  padding: ${(p) => (p.$compact ? "1rem" : "1.5rem")};
`;

export const ModalFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid ${c.gray200};
`;

export const ModalStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

export const ModalFieldStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const ModalSectionTitle = styled.h3`
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray700};
`;

export const DialogCancelButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font: inherit;
  cursor: pointer;
  color: ${c.gray700};
  background: ${c.gray100};
  transition: background 0.15s ease;

  &:hover {
    background: ${c.gray200};
  }
`;

export const DialogPrimaryButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font: inherit;
  cursor: pointer;
  color: ${c.white};
  background: ${c.primary600};
  transition: background 0.15s ease;

  &:hover {
    background: ${c.primary700};
  }
`;

export const DialogCancelButtonSm = styled(DialogCancelButton)`
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
`;

export const DialogPrimaryButtonSm = styled(DialogPrimaryButton)`
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
`;

export const ModalRequiredMark = styled.span`
  margin-left: 0.25rem;
  color: ${c.red500};
`;

export const ModalLead = styled.p`
  margin: 0 0 1.5rem;
  color: ${c.gray600};
`;
