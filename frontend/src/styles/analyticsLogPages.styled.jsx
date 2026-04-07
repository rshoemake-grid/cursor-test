import styled from "styled-components";
import { colors as c } from "./designTokens";

/** Shared scroll shell: `h-full overflow-auto bg-gray-50 p-8` */
export const InsightsScrollShell = styled.div`
  height: 100%;
  overflow: auto;
  background: ${c.gray50};
  padding: 2rem;
`;

export const InsightsInnerWide = styled.div`
  max-width: 80rem;
  margin-left: auto;
  margin-right: auto;
`;

export const InsightsInnerNarrow = styled.div`
  max-width: 72rem;
  margin-left: auto;
  margin-right: auto;
`;

export const InsightsCenteredPane = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 16rem;
`;

export const InsightsMutedText = styled.div`
  color: ${c.gray500};
`;

export const InsightsErrorText = styled.div`
  color: ${c.red500};
`;

export const InsightsPageHeader = styled.div`
  margin-bottom: 1.5rem;
`;

export const InsightsPageTitle = styled.h1`
  margin: 0 0 0.5rem;
  font-size: 1.875rem;
  line-height: 2.25rem;
  font-weight: 700;
  color: ${c.gray900};
`;

export const InsightsPageSubtitle = styled.p`
  margin: 0;
  color: ${c.gray600};
`;

export const AnalyticsStatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

export const AnalyticsPanelCard = styled.div`
  background: ${c.white};
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
  border: 1px solid ${c.gray200};
  padding: 1.5rem;
`;

export const AnalyticsStatCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

export const AnalyticsStatCardLabel = styled.h3`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  color: ${c.gray600};
`;

export const AnalyticsStatCardValue = styled.p`
  margin: 0;
  font-size: 1.875rem;
  line-height: 2.25rem;
  font-weight: 700;
  color: ${c.gray900};
`;

export const AnalyticsIconGray = styled.span`
  display: inline-flex;
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: ${c.gray400};
  }
`;

export const AnalyticsIconGreen = styled.span`
  display: inline-flex;
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: ${c.green500};
  }
`;

export const AnalyticsIconBlue = styled.span`
  display: inline-flex;
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: ${c.blue500};
  }
`;

export const AnalyticsIconRed = styled.span`
  display: inline-flex;
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: ${c.red500};
  }
`;

export const AnalyticsChartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const AnalyticsSectionTitle = styled.h2`
  margin: 0 0 1rem;
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 600;
  color: ${c.gray900};
`;

export const AnalyticsChartEmpty = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 16rem;
  color: ${c.gray500};
`;

export const AnalyticsTwoColGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const AnalyticsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const AnalyticsStatusRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
`;

export const AnalyticsStatusLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray700};
  text-transform: capitalize;
`;

export const AnalyticsStatusMeta = styled.span`
  font-size: 0.875rem;
  color: ${c.gray600};
`;

export const AnalyticsProgressTrack = styled.div`
  width: 100%;
  background: ${c.gray200};
  border-radius: 9999px;
  height: 0.5rem;
`;

export const AnalyticsProgressFill = styled.div`
  height: 0.5rem;
  border-radius: 9999px;
  background: ${({ $status }) => {
    switch ($status) {
      case "completed":
        return c.green500;
      case "failed":
        return c.red500;
      case "running":
        return c.blue500;
      case "pending":
        return c.yellow500;
      default:
        return c.gray500;
    }
  }};
`;

export const AnalyticsListRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: ${c.gray50};
  border-radius: 0.5rem;
`;

export const AnalyticsMonoId = styled.span`
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  color: ${c.gray700};
`;

export const AnalyticsRowMeta = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray900};
`;

export const AnalyticsRecentRowInner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const AnalyticsRecentStatus = styled.span`
  font-size: 0.75rem;
  color: ${c.gray500};
  text-transform: capitalize;
`;

export const AnalyticsRecentTime = styled.span`
  font-size: 0.75rem;
  color: ${c.gray500};
`;

export const AnalyticsIconSmGreen = styled.span`
  display: inline-flex;
  svg {
    width: 1rem;
    height: 1rem;
    color: ${c.green500};
  }
`;

export const AnalyticsIconSmRed = styled.span`
  display: inline-flex;
  svg {
    width: 1rem;
    height: 1rem;
    color: ${c.red500};
  }
`;

export const AnalyticsIconSmYellow = styled.span`
  display: inline-flex;
  svg {
    width: 1rem;
    height: 1rem;
    color: ${c.yellow500};
  }
`;

export const AnalyticsRecentSection = styled.div`
  margin-top: 1.5rem;
`;

export const AnalyticsRecentStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const AnalyticsEmptyHint = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${c.gray500};
`;

/** Log page header row */
export const LogPageHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

export const LogToolbar = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const LogToolbarButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  background: ${({ $variant }) =>
    $variant === "primary" ? c.primary600 : c.gray100};
  color: ${({ $variant }) => ($variant === "primary" ? c.white : c.gray700)};

  &:hover {
    background: ${({ $variant }) =>
      $variant === "primary" ? c.primary700 : c.gray200};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const LogSearchBlock = styled.div`
  margin-bottom: 1rem;
`;

export const LogAdvancedFiltersMount = styled.div`
  margin-top: 1rem;
`;

export const LogFilterCountHint = styled.div`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: ${c.gray600};
`;

export const LogListSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

export const LogVirtualizedItemWrap = styled.div`
  margin-bottom: 0.75rem;
`;

export const LogBulkSelectRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
`;

export const LogBulkCheckbox = styled.input`
  width: 1rem;
  height: 1rem;
  color: ${c.primary600};
  border: 1px solid ${c.gray300};
  border-radius: 0.25rem;
  accent-color: ${c.primary600};

  &:focus-visible {
    outline: 2px solid ${c.primary500};
    outline-offset: 2px;
  }
`;

export const LogBulkSelectLabel = styled.span`
  font-size: 0.875rem;
  color: ${c.gray600};
`;
