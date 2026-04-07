import styled, { css } from "styled-components";
import { colors as c } from "./designTokens";

const controlFocus = css`
  &:focus {
    outline: none;
    border-color: ${c.primary500};
    box-shadow: 0 0 0 2px ${c.primary200};
  }
`;

const controlBase = css`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.5rem;
  font: inherit;
  box-sizing: border-box;
  ${controlFocus}

  &:disabled {
    background: ${c.gray100};
    cursor: not-allowed;
  }
`;

export const FormFieldRoot = styled.div`
  margin-bottom: 1rem;
`;

export const FormFieldLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray700};
  margin-bottom: 0.25rem;
`;

export const FormFieldRequired = styled.span`
  color: ${c.red500};
  margin-left: 0.25rem;
`;

export const FormFieldDescription = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: ${c.gray500};
`;

export const FormFieldTextInput = styled.input`
  ${controlBase}
`;

export const FormFieldTextarea = styled.textarea`
  ${controlBase}
  resize: vertical;
`;

export const FormFieldSelect = styled.select`
  ${controlBase}
  background: ${c.white};
`;

export const FormFieldCheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const FormFieldCheckbox = styled.input`
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
  border: 1px solid ${c.gray300};
  accent-color: ${c.primary600};
  ${controlFocus}
`;

export const FormFieldCheckboxHint = styled.span`
  font-size: 0.875rem;
  color: ${c.gray600};
`;
