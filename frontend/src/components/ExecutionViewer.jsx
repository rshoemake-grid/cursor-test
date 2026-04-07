import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { getExecutionStatusTone } from "../utils/executionStatus";
import { logger } from "../utils/logger";
import { useWorkflowAPI } from "../hooks/workflow";
import {
  ExecutionStatusPill,
  ExecutionStatusMiniChip,
} from "../styles/executionStatus.styled";
import {
  ViewerLoadingCenter,
  ViewerMutedText,
  ViewerErrorText,
  ViewerScroll,
  ViewerInner,
  ViewerLiveBanner,
  ViewerLiveRow,
  ViewerLiveLeft,
  ViewerSpinIconLg,
  ViewerLiveTitle,
  ViewerLiveSub,
  ViewerLiveRight,
  ViewerLiveDot,
  ViewerLiveLabel,
  ViewerCard,
  ViewerCardHeader,
  ViewerTitle,
  ViewerSectionTitle,
  ViewerGrid2,
  ViewerLabel,
  ViewerValue,
  ViewerMono,
  ViewerErrorBox,
  ViewerErrorPara,
  ViewerProgressTrack,
  ViewerProgressBar,
  ViewerProgressFill,
  ViewerNodeStack,
  ViewerNodeCard,
  ViewerNodeRow,
  ViewerNodeLeft,
  ViewerNodeName,
  ViewerIconMdGreen,
  ViewerIconMdRed,
  ViewerIconMdBlueSpin,
  ViewerIconMdGray,
  ViewerBlockLabel,
  ViewerPreSm,
  ViewerOutputHeader,
  ViewerCheck,
  ViewerOutputBox,
  ViewerOutputText,
  ViewerNodeErrorLabel,
  ViewerNodeErrorText,
  ViewerLogStack,
  ViewerLogLine,
  ViewerLogTime,
  ViewerLogLevel,
  ViewerLogNode,
  ViewerResultPre,
  ViewerMetaMuted,
  ViewerSpacedBlock,
  ViewerSpacedBlockLg,
} from "../styles/executionViewer.styled";

function ExecutionViewer({ executionId }) {
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const { getExecution } = useWorkflowAPI();
  useEffect(() => {
    loadExecution();
    const interval = setInterval(() => {
      if (execution?.status === "running" || execution?.status === "pending") {
        setIsPolling(true);
        loadExecution();
      } else {
        setIsPolling(false);
      }
    }, 2e3);
    return () => clearInterval(interval);
  }, [executionId, execution?.status, getExecution]);
  const loadExecution = async () => {
    try {
      const data = await getExecution(executionId);
      setExecution(data);
      setIsPolling(data.status === "running" || data.status === "pending");
    } catch (error) {
      logger.error("Failed to load execution:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <ViewerLoadingCenter>
        <ViewerMutedText>Loading execution...</ViewerMutedText>
      </ViewerLoadingCenter>
    );
  }
  if (!execution) {
    return (
      <ViewerLoadingCenter>
        <ViewerErrorText>Execution not found</ViewerErrorText>
      </ViewerLoadingCenter>
    );
  }
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return (
          <ViewerIconMdGreen>
            <CheckCircle aria-hidden />
          </ViewerIconMdGreen>
        );
      case "failed":
        return (
          <ViewerIconMdRed>
            <XCircle aria-hidden />
          </ViewerIconMdRed>
        );
      case "running":
        return (
          <ViewerIconMdBlueSpin>
            <Clock aria-hidden />
          </ViewerIconMdBlueSpin>
        );
      default:
        return (
          <ViewerIconMdGray>
            <AlertCircle aria-hidden />
          </ViewerIconMdGray>
        );
    }
  };
  const completedNodes = execution.node_states
    ? Object.values(execution.node_states).filter((n) => n.status === "completed")
        .length
    : 0;
  const totalNodes = execution.node_states
    ? Object.keys(execution.node_states).length
    : 0;
  const progressPct =
    totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;
  const headerTone = getExecutionStatusTone(execution.status);
  return (
    <ViewerScroll>
      <ViewerInner>
        {isPolling &&
          (execution.status === "running" ||
            execution.status === "pending") && (
            <ViewerLiveBanner>
              <ViewerLiveRow>
                <ViewerLiveLeft>
                  <ViewerSpinIconLg>
                    <Clock aria-hidden />
                  </ViewerSpinIconLg>
                  <div>
                    <ViewerLiveTitle>Workflow Running...</ViewerLiveTitle>
                    <ViewerLiveSub>
                      Monitoring in real-time • Updates every 2 seconds
                    </ViewerLiveSub>
                  </div>
                </ViewerLiveLeft>
                <ViewerLiveRight>
                  <ViewerLiveDot aria-hidden />
                  <ViewerLiveLabel>LIVE</ViewerLiveLabel>
                </ViewerLiveRight>
              </ViewerLiveRow>
            </ViewerLiveBanner>
          )}
        <ViewerCard>
          <ViewerCardHeader>
            <ViewerTitle>Execution Details</ViewerTitle>
            <ExecutionStatusPill $status={headerTone}>
              {getStatusIcon(execution.status)}
              {execution.status.toUpperCase()}
            </ExecutionStatusPill>
          </ViewerCardHeader>
          <ViewerGrid2>
            <div>
              <ViewerLabel>Execution ID:</ViewerLabel>
              <ViewerMono>{execution.execution_id}</ViewerMono>
            </div>
            <div>
              <ViewerLabel>Workflow ID:</ViewerLabel>
              <ViewerMono>{execution.workflow_id}</ViewerMono>
            </div>
            <div>
              <ViewerLabel>Started:</ViewerLabel>
              <ViewerValue>
                {new Date(execution.started_at).toLocaleString()}
              </ViewerValue>
            </div>
            {execution.completed_at && (
              <div>
                <ViewerLabel>Completed:</ViewerLabel>
                <ViewerValue>
                  {new Date(execution.completed_at).toLocaleString()}
                </ViewerValue>
              </div>
            )}
          </ViewerGrid2>
          {execution.error && (
            <ViewerErrorBox>
              <ViewerErrorPara>
                <strong>Error:</strong> {execution.error}
              </ViewerErrorPara>
            </ViewerErrorBox>
          )}
        </ViewerCard>
        <ViewerCard>
          <ViewerCardHeader>
            <ViewerSectionTitle>Node Execution</ViewerSectionTitle>
            {execution.node_states &&
              Object.keys(execution.node_states).length > 0 && (
                <ViewerMetaMuted>
                  {completedNodes} / {totalNodes} nodes completed
                </ViewerMetaMuted>
              )}
          </ViewerCardHeader>
          {execution.node_states &&
            Object.keys(execution.node_states).length > 0 && (
              <ViewerProgressTrack>
                <ViewerProgressBar>
                  <ViewerProgressFill style={{ width: `${progressPct}%` }} />
                </ViewerProgressBar>
              </ViewerProgressTrack>
            )}
          <ViewerNodeStack>
            {Object.entries(execution.node_states || {}).map(
              ([nodeId, nodeState]) => {
                const nodeTone = getExecutionStatusTone(nodeState.status);
                return (
                  <ViewerNodeCard key={nodeId}>
                    <ViewerNodeRow>
                      <ViewerNodeLeft>
                        {getStatusIcon(nodeState.status)}
                        <ViewerNodeName>{nodeId}</ViewerNodeName>
                      </ViewerNodeLeft>
                      <ExecutionStatusMiniChip $status={nodeTone}>
                        {nodeState.status}
                      </ExecutionStatusMiniChip>
                    </ViewerNodeRow>
                    {nodeState.input && (
                      <ViewerSpacedBlock>
                        <ViewerBlockLabel>Input:</ViewerBlockLabel>
                        <ViewerPreSm>
                          {JSON.stringify(nodeState.input, null, 2)}
                        </ViewerPreSm>
                      </ViewerSpacedBlock>
                    )}
                    {nodeState.output && (
                      <ViewerSpacedBlockLg>
                        <ViewerOutputHeader>
                          <span>Agent Response:</span>
                          {nodeState.status === "completed" && (
                            <ViewerCheck aria-hidden>✓</ViewerCheck>
                          )}
                        </ViewerOutputHeader>
                        <ViewerOutputBox>
                          <ViewerOutputText>
                            {typeof nodeState.output === "string"
                              ? nodeState.output
                              : JSON.stringify(nodeState.output, null, 2)}
                          </ViewerOutputText>
                        </ViewerOutputBox>
                      </ViewerSpacedBlockLg>
                    )}
                    {nodeState.error && (
                      <ViewerSpacedBlock>
                        <ViewerNodeErrorLabel>Error:</ViewerNodeErrorLabel>
                        <ViewerNodeErrorText>
                          {nodeState.error}
                        </ViewerNodeErrorText>
                      </ViewerSpacedBlock>
                    )}
                  </ViewerNodeCard>
                );
              },
            )}
          </ViewerNodeStack>
        </ViewerCard>
        <ViewerCard>
          <ViewerSectionTitle>Execution Logs</ViewerSectionTitle>
          <ViewerLogStack>
            {(execution.logs || []).map((log, index) => (
              <ViewerLogLine key={index} $level={log.level}>
                <ViewerLogTime>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </ViewerLogTime>{" "}
                <ViewerLogLevel $level={log.level}>{log.level}</ViewerLogLevel>
                {log.node_id && (
                  <ViewerLogNode> [{log.node_id}]</ViewerLogNode>
                )}{" "}
                {log.message}
              </ViewerLogLine>
            ))}
          </ViewerLogStack>
        </ViewerCard>
        {execution.result && (
          <ViewerCard>
            <ViewerSectionTitle>Final Result</ViewerSectionTitle>
            <ViewerResultPre>
              {typeof execution.result === "string"
                ? execution.result
                : JSON.stringify(execution.result, null, 2)}
            </ViewerResultPre>
          </ViewerCard>
        )}
      </ViewerInner>
    </ViewerScroll>
  );
}
export { ExecutionViewer as default };
