import styled, { keyframes, css } from "styled-components";
import { colors as c } from "./designTokens";

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const pulseOpacity = keyframes`
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.65;
  }
`;

export const ViewerLoadingCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

export const ViewerMutedText = styled.div`
  color: ${c.gray500};
`;

export const ViewerErrorText = styled.div`
  color: ${c.red500};
`;

export const ViewerScroll = styled.div`
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem;
`;

export const ViewerInner = styled.div`
  max-width: 64rem;
  margin-left: auto;
  margin-right: auto;
`;

export const ViewerLiveBanner = styled.div`
  background: linear-gradient(to right, ${c.blue500}, ${c.blue600});
  color: ${c.white};
  border-radius: 0.5rem;
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
  padding: 1rem;
  margin-bottom: 1.5rem;
  ${css`
    animation: ${pulseOpacity} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  `}
`;

export const ViewerLiveRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ViewerLiveLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const ViewerSpinIconLg = styled.span`
  display: inline-flex;
  color: ${c.white};

  svg {
    width: 1.5rem;
    height: 1.5rem;
    animation: ${spin} 1s linear infinite;
  }
`;

export const ViewerLiveTitle = styled.div`
  font-weight: 600;
  font-size: 1.125rem;
  line-height: 1.75rem;
`;

export const ViewerLiveSub = styled.div`
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: rgb(255 255 255 / 0.85);
`;

export const ViewerLiveRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const ViewerLiveDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: ${c.white};
  ${css`
    animation: ${pulseOpacity} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  `}
`;

export const ViewerLiveLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
`;

export const ViewerCard = styled.div`
  background: ${c.white};
  border-radius: 0.5rem;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

export const ViewerCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

export const ViewerTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 700;
  color: ${c.gray900};
`;

export const ViewerSectionTitle = styled.h3`
  margin: 0 0 1rem;
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 600;
  color: ${c.gray900};
`;

export const ViewerGrid2 = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
`;

export const ViewerLabel = styled.span`
  color: ${c.gray600};
`;

export const ViewerValue = styled.span`
  margin-left: 0.5rem;
  color: ${c.gray900};
`;

export const ViewerMono = styled.span`
  margin-left: 0.5rem;
  font-family: ui-monospace, monospace;
  color: ${c.gray900};
`;

export const ViewerErrorBox = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: ${c.red50};
  border: 1px solid ${c.red200};
  border-radius: 0.5rem;
`;

export const ViewerErrorPara = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${c.red800};
`;

export const ViewerProgressTrack = styled.div`
  margin-bottom: 1rem;
`;

export const ViewerProgressBar = styled.div`
  width: 100%;
  background: ${c.gray200};
  border-radius: 9999px;
  height: 8px;
`;

export const ViewerProgressFill = styled.div.attrs(() => ({
  "data-testid": "execution-viewer-progress-fill",
}))`
  background: ${c.blue600};
  height: 8px;
  border-radius: 9999px;
  transition: width 0.5s ease;
`;

export const ViewerNodeStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const ViewerNodeCard = styled.div`
  border: 1px solid ${c.gray200};
  border-radius: 0.5rem;
  padding: 1rem;
`;

export const ViewerNodeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

export const ViewerNodeLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const ViewerNodeName = styled.span`
  font-weight: 500;
  color: ${c.gray900};
`;

export const ViewerIconMd = styled.span`
  display: inline-flex;

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

export const ViewerIconMdGreen = styled(ViewerIconMd)`
  color: ${c.green600};
`;

export const ViewerIconMdRed = styled(ViewerIconMd)`
  color: ${c.red600};
`;

export const ViewerIconMdBlue = styled(ViewerIconMd)`
  color: ${c.blue600};
`;

export const ViewerIconMdGray = styled(ViewerIconMd)`
  color: ${c.gray600};
`;

export const ViewerIconMdBlueSpin = styled(ViewerIconMdBlue)`
  svg {
    animation: ${spin} 1s linear infinite;
  }
`;

export const ViewerBlockLabel = styled.p`
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${c.gray600};
`;

export const ViewerPreSm = styled.pre`
  margin: 0;
  font-size: 0.75rem;
  background: ${c.gray50};
  padding: 0.5rem;
  border-radius: 0.25rem;
  overflow-x: auto;
`;

export const ViewerOutputHeader = styled.p`
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${c.gray600};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const ViewerCheck = styled.span`
  color: ${c.green600};
`;

export const ViewerOutputBox = styled.div`
  background: linear-gradient(to bottom right, ${c.blue50}, #eef2ff);
  border: 1px solid ${c.blue200};
  border-radius: 0.5rem;
  padding: 1rem;
`;

export const ViewerOutputText = styled.div`
  font-size: 0.875rem;
  color: ${c.gray800};
  white-space: pre-wrap;
  line-height: 1.625;
`;

export const ViewerNodeErrorLabel = styled.p`
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${c.red600};
`;

export const ViewerNodeErrorText = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${c.red700};
  background: ${c.red50};
  padding: 0.5rem;
  border-radius: 0.25rem;
`;

export const ViewerLogStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  line-height: 1rem;
`;

export const ViewerLogLine = styled.div`
  padding: 0.5rem;
  border-radius: 0.25rem;
  background: ${({ $level }) =>
    $level === "ERROR"
      ? c.red50
      : $level === "WARNING"
        ? "#fefce8"
        : c.gray50};
  color: ${({ $level }) =>
    $level === "ERROR"
      ? "#7f1d1d"
      : $level === "WARNING"
        ? c.yellow800
        : c.gray900};
`;

export const ViewerLogTime = styled.span`
  color: ${c.gray500};
`;

export const ViewerLogLevel = styled.span`
  font-weight: 600;
  color: ${({ $level }) =>
    $level === "ERROR"
      ? c.red600
      : $level === "WARNING"
        ? "#ca8a04"
        : c.blue600};
`;

export const ViewerLogNode = styled.span`
  color: ${c.gray600};
`;

export const ViewerResultPre = styled.pre`
  margin: 0;
  font-size: 0.875rem;
  background: ${c.gray50};
  padding: 1rem;
  border-radius: 0.25rem;
  overflow-x: auto;
`;

export const ViewerMetaMuted = styled.div`
  font-size: 0.875rem;
  color: ${c.gray600};
`;

export const ViewerSpacedBlock = styled.div`
  margin-top: 0.5rem;
`;

export const ViewerSpacedBlockLg = styled.div`
  margin-top: 0.75rem;
`;
