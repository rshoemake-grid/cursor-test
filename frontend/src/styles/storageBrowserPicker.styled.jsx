import styled from "styled-components";

const c = {
  white: "#ffffff",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray500: "#6b7280",
  gray700: "#374151",
  gray900: "#111827",
  primary600: "#2563eb",
  primary700: "#1d4ed8",
  danger600: "#dc2626",
};

export const StoragePickerOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 0.45);
  padding: 1rem;
`;

export const StoragePickerPanel = styled.div`
  background: ${c.white};
  border-radius: 0.75rem;
  box-shadow:
    0 25px 50px -12px rgb(0 0 0 / 0.25),
    0 0 0 1px ${c.gray200};
  width: min(36rem, 100%);
  max-height: min(32rem, 90vh);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const StoragePickerHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${c.gray200};
`;

export const StoragePickerTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${c.gray900};
`;

export const StoragePickerSubtitle = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: ${c.gray500};
  word-break: break-all;
`;

export const StoragePickerClose = styled.button`
  flex-shrink: 0;
  padding: 0.35rem 0.6rem;
  border: 1px solid ${c.gray200};
  border-radius: 0.375rem;
  background: ${c.white};
  color: ${c.gray700};
  font: inherit;
  font-size: 0.8125rem;
  cursor: pointer;

  &:hover {
    background: ${c.gray50};
  }
`;

export const StoragePickerToolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  border-bottom: 1px solid ${c.gray200};
  background: ${c.gray50};
`;

export const StoragePickerPath = styled.div`
  font-size: 0.75rem;
  color: ${c.gray700};
  font-family: ui-monospace, monospace;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StoragePickerToolbarBtn = styled.button`
  padding: 0.35rem 0.65rem;
  border: 1px solid ${c.gray200};
  border-radius: 0.375rem;
  background: ${c.white};
  color: ${c.gray700};
  font: inherit;
  font-size: 0.8125rem;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${c.gray100};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const StoragePickerList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
  overflow-y: auto;
  flex: 1;
  min-height: 12rem;
`;

export const StoragePickerRow = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 1.25rem;
  font-size: 0.875rem;
  cursor: pointer;
  background: ${(p) => (p.$selected ? c.gray100 : "transparent")};
  color: ${c.gray900};

  &:hover {
    background: ${c.gray50};
  }
`;

export const StoragePickerRowMeta = styled.span`
  margin-left: auto;
  font-size: 0.75rem;
  color: ${c.gray500};
`;

export const StoragePickerFilenameSection = styled.div`
  padding: 0.65rem 1.25rem;
  border-top: 1px solid ${c.gray200};
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex-shrink: 0;
`;

export const StoragePickerFilenameLabel = styled.label`
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${c.gray700};
`;

export const StoragePickerFilenameInput = styled.input`
  font: inherit;
  font-size: 0.875rem;
  padding: 0.4rem 0.55rem;
  border: 1px solid ${c.gray200};
  border-radius: 0.375rem;
  color: ${c.gray900};
  width: 100%;
  box-sizing: border-box;
  background: ${c.white};

  &:focus {
    outline: 2px solid ${c.primary600};
    outline-offset: 1px;
  }
`;

export const StoragePickerFilenameHint = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${c.gray500};
`;

export const StoragePickerFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid ${c.gray200};
`;

export const StoragePickerPrimaryBtn = styled.button`
  padding: 0.45rem 1rem;
  border: none;
  border-radius: 0.375rem;
  background: ${c.primary600};
  color: ${c.white};
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${c.primary700};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const StoragePickerMessage = styled.p`
  margin: 0;
  padding: 1rem 1.25rem;
  font-size: 0.875rem;
  color: ${(p) => (p.$error ? c.danger600 : c.gray500)};
`;
