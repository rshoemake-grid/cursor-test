import PropTypes from "prop-types";
import { Clock, CheckCircle, XCircle, Play, AlertCircle } from "lucide-react";
import ExecutionStatusBadge from "./ExecutionStatusBadge";
import {
  ExecutionLogEmptyBlock,
  DarkEmptyIconWrap,
  DarkEmptyTitle,
  DarkEmptySubtitle,
} from "../styles/contentBlocks.styled";
import {
  ExecLogScroll,
  ExecLogInner,
  ExecLogPad,
  ExecLogHeaderBlock,
  ExecLogTitle,
  ExecLogSubtitle,
  ExecLogCardStack,
  ExecLogCard,
  ExecLogCardRow,
  ExecLogCardMain,
  ExecLogIdRow,
  ExecLogMono,
  ExecLogNodeRow,
  ExecLogNodeLabel,
  ExecLogNodeValue,
  ExecLogProgressBlock,
  ExecLogProgressRow,
  ExecLogProgressTrack,
  ExecLogProgressFill,
  ExecLogMetaRow,
  ExecLogMetaItem,
  ExecLogMetaMuted,
  ExecLogCardAside,
  ExecLogStatusDone,
  ExecLogStatusFail,
  ExecLogStatusActive,
  ExecStatusIconWrap,
} from "../styles/executionConsole.styled";

function ExecutionLogTab({ executions, onExecutionClick }) {
  const sortedExecutions = [...executions].sort((a, b) => {
    const aTime = new Date(a.startedAt).getTime();
    const bTime = new Date(b.startedAt).getTime();
    return bTime - aTime;
  });
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return (
          <ExecStatusIconWrap $status="completed">
            <CheckCircle aria-hidden />
          </ExecStatusIconWrap>
        );
      case "failed":
        return (
          <ExecStatusIconWrap $status="failed">
            <XCircle aria-hidden />
          </ExecStatusIconWrap>
        );
      case "running":
        return (
          <ExecStatusIconWrap $status="running" $pulse>
            <Play aria-hidden />
          </ExecStatusIconWrap>
        );
      case "pending":
        return (
          <ExecStatusIconWrap $status="pending">
            <Clock aria-hidden />
          </ExecStatusIconWrap>
        );
      default:
        return (
          <ExecStatusIconWrap $status="default">
            <AlertCircle aria-hidden />
          </ExecStatusIconWrap>
        );
    }
  };
  const getCurrentNode = (execution) => {
    if (execution.nodes && typeof execution.nodes === "object") {
      const nodeEntries = Object.entries(execution.nodes);
      for (const [nodeId, state] of nodeEntries) {
        if (state && typeof state === "object" && "status" in state) {
          const nodeState = state;
          if (nodeState.status === "running") {
            return nodeId;
          }
        }
      }
      const completedNodes = nodeEntries
        .filter(([_, state]) => {
          if (state && typeof state === "object" && "status" in state) {
            return state.status === "completed";
          }
          return false;
        })
        .sort(([_, a], [__, b]) => {
          const aState = a;
          const bState = b;
          const aTime = aState?.completed_at
            ? new Date(aState.completed_at).getTime()
            : 0;
          const bTime = bState?.completed_at
            ? new Date(bState.completed_at).getTime()
            : 0;
          return bTime - aTime;
        });
      if (completedNodes.length > 0) {
        return completedNodes[0][0];
      }
    }
    return null;
  };
  const formatDuration = (startedAt, completedAt) => {
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    const duration = Math.floor((end - start) / 1e3);
    if (duration < 60) {
      return `${duration}s`;
    } else if (duration < 3600) {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };
  if (sortedExecutions.length === 0) {
    return (
      <ExecLogScroll>
        <ExecutionLogEmptyBlock>
          <DarkEmptyIconWrap>
            <AlertCircle aria-hidden />
          </DarkEmptyIconWrap>
          <DarkEmptyTitle>No executions yet</DarkEmptyTitle>
          <DarkEmptySubtitle>
            Execute a workflow to see execution logs here
          </DarkEmptySubtitle>
        </ExecutionLogEmptyBlock>
      </ExecLogScroll>
    );
  }
  return (
    <ExecLogInner>
      <ExecLogPad>
        <ExecLogHeaderBlock>
          <ExecLogTitle>Execution Log</ExecLogTitle>
          <ExecLogSubtitle>
            {sortedExecutions.length} execution
            {sortedExecutions.length !== 1 ? "s" : ""} total
          </ExecLogSubtitle>
        </ExecLogHeaderBlock>
        <ExecLogCardStack>
          {sortedExecutions.map((execution) => {
            const currentNode = getCurrentNode(execution);
            const isActive =
              execution.status === "running" || execution.status === "pending";
            return (
              <ExecLogCard
                key={execution.id}
                $active={isActive}
                onClick={() => onExecutionClick?.(execution.id)}
                title={`Click to view execution ${execution.id.slice(0, 8)}...`}
              >
                <ExecLogCardRow>
                  <ExecLogCardMain>
                    <ExecLogIdRow>
                      {getStatusIcon(execution.status)}
                      <ExecLogMono>{execution.id.slice(0, 8)}...</ExecLogMono>
                      <ExecutionStatusBadge
                        status={execution.status}
                        variant="light"
                      />
                    </ExecLogIdRow>
                    {currentNode && (
                      <ExecLogNodeRow>
                        <ExecLogNodeLabel>Current Node:</ExecLogNodeLabel>
                        <ExecLogNodeValue>{currentNode}</ExecLogNodeValue>
                      </ExecLogNodeRow>
                    )}
                    {execution.status === "running" &&
                      execution.nodes &&
                      typeof execution.nodes === "object" && (
                        <ExecLogProgressBlock>
                          <ExecLogProgressRow>
                            <span>Progress:</span>
                            <ExecLogProgressTrack>
                              {(() => {
                                const nodeEntries = Object.entries(
                                  execution.nodes,
                                );
                                const totalNodes = nodeEntries.length;
                                const completedNodes = nodeEntries.filter(
                                  ([_, state]) => {
                                    if (
                                      state &&
                                      typeof state === "object" &&
                                      "status" in state
                                    ) {
                                      return state.status === "completed";
                                    }
                                    return false;
                                  },
                                ).length;
                                const progress =
                                  totalNodes > 0
                                    ? (completedNodes / totalNodes) * 100
                                    : 0;
                                return (
                                  <ExecLogProgressFill
                                    style={{
                                      width: `${Math.min(progress, 100)}%`,
                                    }}
                                  />
                                );
                              })()}
                            </ExecLogProgressTrack>
                          </ExecLogProgressRow>
                        </ExecLogProgressBlock>
                      )}
                    <ExecLogMetaRow>
                      <ExecLogMetaItem>
                        <Clock aria-hidden />
                        <span>
                          Started:{" "}
                          {new Date(execution.startedAt).toLocaleString()}
                        </span>
                      </ExecLogMetaItem>
                      {execution.completedAt && (
                        <ExecLogMetaItem>
                          <CheckCircle aria-hidden />
                          <span>
                            Completed:{" "}
                            {new Date(execution.completedAt).toLocaleString()}
                          </span>
                        </ExecLogMetaItem>
                      )}
                      <ExecLogMetaMuted>
                        Duration:{" "}
                        {formatDuration(
                          execution.startedAt,
                          execution.completedAt,
                        )}
                      </ExecLogMetaMuted>
                    </ExecLogMetaRow>
                  </ExecLogCardMain>
                  <ExecLogCardAside>
                    {execution.status === "completed" && (
                      <ExecLogStatusDone>✓ Completed</ExecLogStatusDone>
                    )}
                    {execution.status === "failed" && (
                      <ExecLogStatusFail>✗ Failed</ExecLogStatusFail>
                    )}
                    {isActive && (
                      <ExecLogStatusActive>● In Progress</ExecLogStatusActive>
                    )}
                  </ExecLogCardAside>
                </ExecLogCardRow>
              </ExecLogCard>
            );
          })}
        </ExecLogCardStack>
      </ExecLogPad>
    </ExecLogInner>
  );
}

ExecutionLogTab.propTypes = {
  executions: PropTypes.arrayOf(PropTypes.object).isRequired,
  onExecutionClick: PropTypes.func.isRequired,
};

export { ExecutionLogTab as default };
