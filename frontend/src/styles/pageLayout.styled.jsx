import styled from "styled-components";
import { colors as c } from "./designTokens";

/** Full-viewport column shell: replaces `h-screen bg-gray-50 flex flex-col overflow-hidden` */
export const PageShellColumn = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${c.gray50};
  overflow: hidden;
`;

/** White header band under shell: `bg-white border-b border-gray-200 flex-shrink-0` */
export const PageHeaderBand = styled.div`
  background: ${c.white};
  border-bottom: 1px solid ${c.gray200};
  flex-shrink: 0;
`;

/** Centered content column in header: `max-w-7xl mx-auto px-4 py-6` */
export const PageHeaderInner = styled.div`
  max-width: 80rem;
  margin-left: auto;
  margin-right: auto;
  padding: 1.5rem 1rem;
`;

export const PageBackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0;
  border: none;
  background: transparent;
  font: inherit;
  cursor: pointer;
  color: ${c.gray600};
  transition: color 0.15s ease;

  &:hover {
    color: ${c.gray900};
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

export const PageTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

export const PageTitleGroup = styled.div``;

export const PageTitle = styled.h1`
  margin: 0;
  font-size: 1.875rem;
  line-height: 2.25rem;
  font-weight: 700;
  color: ${c.gray900};
`;

export const PageSubtitle = styled.p`
  margin: 0.25rem 0 0;
  font-size: 1rem;
  line-height: 1.5rem;
  color: ${c.gray600};
`;

export const PageActionsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const TabStrip = styled.div`
  display: flex;
  border-bottom: 1px solid ${c.gray200};
  margin-bottom: 1rem;
`;

/** Scrollable main: `max-w-7xl mx-auto px-4 py-8 flex-1 overflow-y-auto` */
export const PageMainScroll = styled.div`
  max-width: 80rem;
  margin-left: auto;
  margin-right: auto;
  padding: 2rem 1rem;
  flex: 1;
  overflow-y: auto;
`;

/** Centered full-min-height panel: `min-h-screen bg-gray-50 flex items-center justify-center p-4` */
export const CenteredScreenPanel = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: ${c.gray50};
`;
