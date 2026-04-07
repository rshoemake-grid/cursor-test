import styled from "styled-components";
import { colors as c } from "./designTokens";

export const TemplateFiltersBar = styled.div`
  background: ${c.white};
  border-bottom: 1px solid ${c.gray200};
  padding: 1rem 0;
`;

export const TemplateFiltersInner = styled.div`
  max-width: 80rem;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
`;

export const TemplateFiltersRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
`;

export const TemplateFilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const TemplateFilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray700};
  white-space: nowrap;
`;

export const TemplateFilterSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.5rem;
  font: inherit;
  background: ${c.white};

  &:focus {
    outline: none;
    border-color: ${c.primary500};
    box-shadow: 0 0 0 2px ${c.primary200};
  }
`;

export const TemplateSearchGrow = styled.div`
  flex: 1;
  min-width: 200px;
`;

export const TemplateSearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 1rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.5rem;
  font: inherit;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${c.primary500};
    box-shadow: 0 0 0 2px ${c.primary200};
  }
`;

export const TemplateSearchButton = styled.button`
  padding: 0.5rem 1.5rem;
  background: ${c.gray200};
  color: ${c.gray700};
  border: none;
  border-radius: 0.5rem;
  font: inherit;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${c.gray300};
  }
`;
