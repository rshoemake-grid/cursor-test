import styled from "styled-components";
import { colors as c } from "./designTokens";

export const WorkflowListScroll = styled.div`
  height: 100%;
  overflow-y: auto;
`;

export const WorkflowListInner = styled.div`
  padding: 1.5rem;
`;

export const WorkflowListHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

export const WorkflowListTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const WorkflowBackButton = styled.button`
  padding: 0.5rem;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  color: ${c.gray600};
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: ${c.gray100};
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

export const WorkflowListTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 700;
  color: ${c.gray900};
`;

export const WorkflowBulkToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const WorkflowBulkCount = styled.span`
  font-size: 0.875rem;
  color: ${c.gray600};
`;

export const WorkflowPrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  color: ${c.white};
  background: ${({ $variant }) =>
    $variant === "danger" ? c.red600 : c.blue600};
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ $variant }) =>
      $variant === "danger" ? c.red700 : c.blue700};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const WorkflowSelectAllRow = styled.div`
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const WorkflowSelectAllButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: ${c.gray700};
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${c.gray100};
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

export const WorkflowIconPrimary = styled.span`
  display: inline-flex;
  color: ${c.primary600};
`;

export const WorkflowIconMuted = styled.span`
  display: inline-flex;
  color: ${c.gray400};
`;

export const WorkflowCardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding-bottom: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const WorkflowCard = styled.div`
  background: ${c.white};
  border-radius: 0.5rem;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
  padding: 1rem;
  border: 2px solid
    ${({ $selected }) => ($selected ? c.primary500 : "transparent")};
  background-color: ${({ $selected }) =>
    $selected ? c.primary50 : c.white};
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease,
    background-color 0.15s ease;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};

  &:hover {
    box-shadow:
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1);
  }
`;

export const WorkflowCardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

export const WorkflowCardTopLeft = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
`;

export const WorkflowCheckboxButton = styled.button`
  margin-top: 0.25rem;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
`;

export const WorkflowCardBody = styled.div`
  flex: 1;
  min-width: 0;
`;

export const WorkflowCardName = styled.h3`
  margin: 0;
  font-weight: 600;
  color: ${c.gray900};
`;

export const WorkflowCardDesc = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: ${c.gray600};
`;

export const WorkflowCardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
`;

export const WorkflowIconAction = styled.button`
  padding: 0.25rem;
  border: none;
  border-radius: 0.25rem;
  background: transparent;
  cursor: pointer;
  color: ${({ $variant }) => ($variant === "danger" ? c.red600 : c.blue600)};
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ $variant }) =>
      $variant === "danger" ? c.red50 : c.blue50};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const WorkflowCardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: ${c.gray500};

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const WorkflowMetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

export const WorkflowLoadingCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

export const WorkflowLoadingText = styled.div`
  color: ${c.gray500};
`;
