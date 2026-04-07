import styled, { css } from "styled-components";
import { colors as c } from "./designTokens";

export const LogBulkBar = styled.div`
  background: ${c.primary600};
  color: ${c.white};
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

export const LogBulkLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const LogBulkCount = styled.span`
  font-weight: 500;
`;

export const LogBulkActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const LogBulkDeleteBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  background: ${c.red600};
  color: ${c.white};
  transition: background-color 0.15s ease, opacity 0.15s ease;

  &:hover:not(:disabled) {
    background: ${c.red700};
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

export const LogBulkCloseBtn = styled.button`
  padding: 0.5rem;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  color: ${c.white};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${c.primary700};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const LogAdvRoot = styled.div`
  position: relative;
`;

export const LogAdvInputWrap = styled.div`
  position: relative;
`;

export const LogAdvSearchIcon = styled.span`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  display: flex;
  color: ${c.gray400};

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const LogAdvInput = styled.input`
  width: 100%;
  padding: 0.5rem 2.5rem;
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

export const LogAdvClearBtn = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
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
    width: 1rem;
    height: 1rem;
  }
`;

export const LogAdvToggleBtn = styled.button`
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  font: inherit;
  transition: color 0.15s ease;
  color: ${({ $active }) => ($active ? c.primary600 : c.gray600)};

  &:hover {
    color: ${c.primary600};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const focusRing = css`
  &:focus {
    outline: none;
    border-color: ${c.primary500};
    box-shadow: 0 0 0 2px ${c.primary200};
  }
`;

export const LogFiltersCard = styled.div`
  background: ${c.white};
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
  border: 1px solid ${c.gray200};
  padding: 1rem;
  margin-bottom: 1rem;
`;

export const LogFiltersHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;

  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: ${c.gray500};
  }
`;

export const LogFiltersTitle = styled.h2`
  margin: 0;
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 600;
  color: ${c.gray900};
`;

export const LogFiltersClear = styled.button`
  margin-left: auto;
  font-size: 0.875rem;
  border: none;
  background: transparent;
  color: ${c.primary600};
  cursor: pointer;
  font: inherit;
  padding: 0;

  &:hover {
    color: ${c.primary700};
  }
`;

export const LogFiltersStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const LogFieldLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray700};
  margin-bottom: 0.5rem;
`;

export const LogFiltersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

export const LogStatusStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const LogCheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
`;

export const LogCheckbox = styled.input`
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
  border: 1px solid ${c.gray300};
  accent-color: ${c.primary600};
  ${focusRing}
`;

export const LogCheckboxText = styled.span`
  font-size: 0.875rem;
  color: ${c.gray700};
`;

export const LogFilterSelect = styled.select`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.5rem;
  font: inherit;
  background: ${c.white};
  box-sizing: border-box;
  ${focusRing}
`;

export const LogListItemRoot = styled.div.attrs(
  ({ $selected, $isActive }) => ({
    "data-testid": "execution-list-item",
    "data-selected": $selected ? "true" : "false",
    "data-active": $isActive ? "true" : "false",
  }),
)`
  background: ${c.white};
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
  border: 1px solid
    ${({ $selected, $isActive }) => {
      if ($selected) {
        return c.primary500;
      }
      if ($isActive) {
        return c.blue500;
      }
      return c.gray200;
    }};
  background-color: ${({ $selected }) =>
    $selected ? c.primary50 : c.white};
  padding: 1rem;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
  cursor: pointer;

  &:hover {
    border-color: ${({ $selected, $isActive }) => {
      if ($selected) {
        return c.primary500;
      }
      if ($isActive) {
        return c.blue400;
      }
      return c.gray300;
    }};
    box-shadow:
      0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1);
  }
`;

export const LogListItemRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`;

export const LogListCheckboxCol = styled.div`
  flex-shrink: 0;
  padding-top: 0.25rem;
`;

export const LogListMain = styled.div`
  flex: 1;
  min-width: 0;
`;

export const LogListIdRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

export const LogListMono = styled.span`
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  color: ${c.gray700};
`;

export const LogListMeta = styled.span`
  font-size: 0.75rem;
  color: ${c.gray500};
`;

export const LogListNodeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

export const LogListNodeLabel = styled.span`
  font-size: 0.75rem;
  color: ${c.gray500};
`;

export const LogListNodeValue = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray700};
`;

export const LogListProgressBlock = styled.div`
  margin-bottom: 0.5rem;
`;

export const LogListProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: ${c.gray500};
`;

export const LogListProgressTrack = styled.div`
  flex: 1;
  max-width: 20rem;
  background: ${c.gray200};
  border-radius: 9999px;
  height: 6px;
  overflow: hidden;
`;

export const LogListProgressFill = styled.div`
  background: ${c.blue500};
  height: 100%;
  transition: width 0.3s ease;
`;

export const LogListMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: ${c.gray500};
`;

export const LogListMetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;

  svg {
    width: 0.75rem;
    height: 0.75rem;
    flex-shrink: 0;
  }
`;

export const LogListDuration = styled.div`
  color: ${c.gray600};
  white-space: nowrap;
`;

export const LogListAside = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;
`;

export const LogListViewBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  background: ${c.primary600};
  color: ${c.white};
  transition: background-color 0.15s ease;

  &:hover {
    background: ${c.primary700};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const LogAdvPanelRoot = styled.div`
  background: ${c.white};
  border: 1px solid ${c.gray200};
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
`;

export const LogAdvPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

export const LogAdvPanelTitle = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 600;
  color: ${c.gray900};
`;

export const LogAdvPanelCloseBtn = styled.button`
  padding: 0.25rem;
  border: none;
  border-radius: 0.25rem;
  background: transparent;
  cursor: pointer;
  display: flex;
  color: ${c.gray700};
  transition: background-color 0.15s ease;

  &:hover {
    background: ${c.gray100};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const LogAdvPanelStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const LogAdvTwoColGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
`;

export const LogAdvSubLabel = styled.label`
  display: block;
  font-size: 0.75rem;
  line-height: 1rem;
  color: ${c.gray500};
  margin-bottom: 0.25rem;
`;

export const LogAdvControlInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.5rem;
  font: inherit;
  font-size: 0.875rem;
  box-sizing: border-box;
  ${focusRing}
`;

export const LogAdvClearLink = styled.button`
  margin-top: 0.25rem;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 0.75rem;
  line-height: 1rem;
  color: ${c.primary600};
  cursor: pointer;
  font: inherit;

  &:hover {
    color: ${c.primary700};
  }
`;
