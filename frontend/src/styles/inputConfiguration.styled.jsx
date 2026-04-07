import styled from "styled-components";
import { colors as c } from "./designTokens";

export const InputConfigHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

export const InputConfigSectionLabel = styled.span`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${c.gray900};
`;

export const InputConfigAddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font: inherit;
  cursor: pointer;
  color: ${c.primary700};
  background: ${c.primary100};
  transition: background 0.15s ease;

  &:hover {
    background: ${c.primary200};
  }
`;

export const InputConfigList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

export const InputConfigCard = styled.div`
  padding: 0.75rem;
  background: ${c.gray50};
  border: 1px solid ${c.gray200};
  border-radius: 0.25rem;
`;

export const InputConfigCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

export const InputConfigCardName = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${c.gray700};
`;

export const InputConfigRemoveButton = styled.button`
  padding: 0.25rem;
  border: none;
  border-radius: 0.25rem;
  background: transparent;
  color: ${c.red600};
  cursor: pointer;
  line-height: 0;

  &:hover {
    background: ${c.red50};
  }
`;

export const InputConfigFieldStack = styled.div`
  font-size: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const InputConfigFieldLabel = styled.span`
  color: ${c.gray500};
`;

export const InputConfigInlineInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  margin-top: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.25rem;
  font: inherit;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${c.primary500};
  }
`;

export const InputConfigModalTitle = styled.h4`
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: ${c.gray900};
`;

export const InputConfigModalFormStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const InputConfigModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
`;

export const InputConfigTip = styled.div`
  margin-top: 0;
  padding: 0.5rem;
  font-size: 0.75rem;
  color: ${c.gray500};
  background: ${c.blue50};
  border-radius: 0.25rem;
`;
