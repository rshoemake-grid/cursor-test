import styled, { css } from "styled-components";
import { colors as c } from "./designTokens";

export const PaginationRoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const PaginationLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const PaginationSummary = styled.div`
  font-size: 0.875rem;
  color: ${c.gray600};
`;

export const PaginationStrong = styled.span`
  font-weight: 500;
`;

export const PaginationPerPage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const PaginationLabel = styled.label`
  font-size: 0.875rem;
  color: ${c.gray600};
`;

export const PaginationSelect = styled.select`
  padding: 0.25rem 0.5rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.25rem;
  font-size: 0.875rem;
  background: ${c.white};

  &:focus {
    outline: none;
    border-color: ${c.primary500};
    box-shadow: 0 0 0 2px ${c.primary200};
  }
`;

export const PaginationNav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const PaginationIconButton = styled.button`
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid ${c.gray300};
  background: ${c.white};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background: ${c.gray50};
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

export const PaginationPages = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

export const PaginationEllipsis = styled.span`
  padding: 0 0.5rem;
  color: ${c.gray500};
`;

export const PaginationPageButton = styled.button`
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
  ${({ $active }) =>
    $active
      ? css`
          background: ${c.primary600};
          color: ${c.white};
          border: 1px solid ${c.primary600};
        `
      : css`
          border: 1px solid ${c.gray300};
          color: ${c.gray700};
          background: ${c.white};

          &:hover {
            background: ${c.gray50};
          }
        `}
`;

export const SearchBarRoot = styled.div`
  position: relative;
`;

export const SearchBarIconLeft = styled.div`
  position: absolute;
  inset: 0 auto 0 0;
  padding-left: 0.75rem;
  display: flex;
  align-items: center;
  pointer-events: none;

  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: ${c.gray400};
  }
`;

export const SearchBarInput = styled.input`
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 2.5rem;
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

export const SearchBarClear = styled.button`
  position: absolute;
  inset: 0 0 0 auto;
  padding-right: 0.75rem;
  display: flex;
  align-items: center;
  border: none;
  background: transparent;
  color: ${c.gray400};
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: ${c.gray600};
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const toastSkin = {
  success: {
    bg: "#f0fdf4",
    border: "#bbf7d0",
    text: c.green800,
    icon: c.green600,
  },
  error: {
    bg: "#fef2f2",
    border: "#fecaca",
    text: c.red800,
    icon: c.red600,
  },
  info: {
    bg: c.blue50,
    border: c.blue200,
    text: c.blue900,
    icon: c.blue600,
  },
  warning: {
    bg: "#fefce8",
    border: c.amber200,
    text: c.amber900,
    icon: c.amber700,
  },
};

export const ToastRoot = styled.div.attrs((p) => ({
  "data-toast-type": p.$type ?? "info",
}))`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid
    ${({ $type }) => toastSkin[$type]?.border || toastSkin.info.border};
  background: ${({ $type }) => toastSkin[$type]?.bg || toastSkin.info.bg};
  color: ${({ $type }) => toastSkin[$type]?.text || toastSkin.info.text};
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
`;

export const ToastIconWrap = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  margin-top: 2px;
  color: ${({ $type }) => toastSkin[$type]?.icon || toastSkin.info.icon};

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

export const ToastBody = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ToastMessage = styled.p`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
`;

export const ToastDismiss = styled.button`
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: ${c.gray400};
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: ${c.gray600};
  }

  svg {
    width: 1rem;
    height: 1rem;
    margin-top: 0;
  }
`;

export const ToastContainerRoot = styled.div.attrs(() => ({
  "data-testid": "toast-container-root",
}))`
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 28rem;
  width: 100%;
  pointer-events: none;
`;

export const ToastContainerItem = styled.div`
  pointer-events: auto;
`;
