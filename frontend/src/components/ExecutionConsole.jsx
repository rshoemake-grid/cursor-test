import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { ChevronDown, ChevronUp, MessageSquare, Play, X } from "lucide-react";
import WorkflowChat from "./WorkflowChat";
import { useWebSocket } from "../hooks/execution";
import { useAuth } from "../contexts/AuthContext";
import ExecutionStatusBadge from "./ExecutionStatusBadge";
import LogLevelBadge from "./LogLevelBadge";
import { logger } from "../utils/logger";
import { extractApiErrorMessage } from "../hooks/utils/apiUtils";
import { nullableString } from "../utils/propTypes";
import { getLogLevelTone } from "../utils/logLevel";
import { defaultAdapters } from "../types/adapters";
import { coalesceString } from "../utils/nullCoalescing";
import { LOG_LEVELS } from "../constants/stringLiterals";
import { isValidExecutionStatus } from "../utils/executionStatus";
import { deriveExecutionCompletionFromWsResult } from "../hooks/utils/wsExecutionCompletion";
import { ConsoleEmptyState } from "../styles/contentBlocks.styled";
import {
  ConsoleRoot,
  ConsoleResizeHandle,
  ConsoleTabBar,
  ConsoleTabScroll,
  ConsoleTabCluster,
  ConsoleTabButton,
  ConsoleTabLabel,
  ConsoleStatusDot,
  ConsoleTabClose,
  ConsoleExpandToggle,
  ConsoleTabBarActions,
  ConsoleBody,
  ConsoleLogScroll,
  ConsoleLogStack,
  ConsoleLogHeaderRow,
  ConsoleLogTitle,
  ConsoleLogMeta,
  ConsoleExecutionErrorPanel,
  ConsoleExecutionErrorLabel,
  ConsoleLogEntries,
  ConsoleLogEntry,
  ConsoleLogTime,
  ConsoleLogNodeRef,
} from "../styles/executionConsole.styled";

/**
 * Normalize execution status from WS `status` messages only.
 * Ignores transport-only strings (connected / disconnected / error) from
 * WebSocketConnectionManager so they do not overwrite workflow status in UI.
 */
function normalizeExecutionStatusFromSocket(status) {
  if (status == null) {
    return "";
  }
  if (typeof status === "string") {
    const s = status.toLowerCase().trim();
    return s === "canceled" ? "cancelled" : s;
  }
  if (typeof status === "object" && status.value != null) {
    return normalizeExecutionStatusFromSocket(status.value);
  }
  return "";
}

function resolveExecutionFailureDetail(execution) {
  if (!execution) {
    return null;
  }
  if (execution.error != null && String(execution.error).trim() !== "") {
    return String(execution.error);
  }
  const nodes = execution.nodes || {};
  for (const state of Object.values(nodes)) {
    if (
      state &&
      state.status === "failed" &&
      state.error != null &&
      String(state.error).trim() !== ""
    ) {
      return String(state.error);
    }
  }
  return null;
}

function ExecutionConsole({
  workflowContext,
  executionsState,
  chatBridge,
  executionCallbacks,
  environment = {},
}) {
  const { activeWorkflowId, workflowTabId = null } = workflowContext;
  const { executions = [], activeExecutionId = null } = executionsState;
  const {
    onWorkflowUpdate,
    getWorkflowChatCanvasSnapshot = null,
    workflowChatClearNonce = 0,
  } = chatBridge;
  const {
    onExecutionLogUpdate,
    onExecutionStatusUpdate,
    onExecutionNodeUpdate,
    onRemoveExecution,
    onActiveExecutionChange,
  } = executionCallbacks;
  const {
    documentAdapter = defaultAdapters.createDocumentAdapter(),
  } = environment;
  const { token: authToken } = useAuth();
  const authTokenRef = useRef(authToken);
  authTokenRef.current = authToken;
  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(300);
  const [activeTab, setActiveTab] = useState("chat");
  const isResizing = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const activeWorkflowIdRef = useRef(activeWorkflowId);
  const executionsRef = useRef(executions);
  const lastSyncedParentExecutionIdRef = useRef(undefined);
  const activeExecutionIdRef = useRef(activeExecutionId);
  const onExecutionStatusUpdateRef = useRef(onExecutionStatusUpdate);
  const onExecutionLogUpdateRef = useRef(onExecutionLogUpdate);
  const onExecutionNodeUpdateRef = useRef(onExecutionNodeUpdate);
  const allTabs = useMemo(
    () => [
      {
        id: "chat",
        name: "Chat",
        type: "chat",
      },
      ...executions.map((exec) => ({
        id: String(exec.id),
        name: String(exec.id).slice(0, 8),
        type: "execution",
        execution: exec,
      })),
    ],
    [executions],
  );
  /** Changes when execution rows are added/removed, not when logs/status mutate (avoids effect churn). */
  const executionIdsKey = useMemo(() => {
    const ids = executions
      .map((e) => (e && e.id != null ? String(e.id) : ""))
      .filter(Boolean);
    return [...new Set(ids)].sort().join("|");
  }, [executions]);
  const activeTabData = useMemo(
    () => allTabs.find((t) => t.id === activeTab),
    [allTabs, activeTab],
  );
  const activeExecution =
    activeTabData?.type === "execution" ? activeTabData.execution : null;
  const resolvedExecution = useMemo(() => {
    if (activeExecution) {
      return activeExecution;
    }
    if (
      activeTab !== "chat" &&
      activeExecutionId != null &&
      activeExecutionId !== "" &&
      String(activeTab) === String(activeExecutionId)
    ) {
      return (
        executions.find(
          (e) => e && String(e.id) === String(activeExecutionId),
        ) ?? null
      );
    }
    return null;
  }, [activeExecution, activeTab, activeExecutionId, executions]);
  const activeExecutionStatus = useMemo(() => {
    if (
      activeExecutionId !== null &&
      activeExecutionId !== void 0 &&
      activeExecutionId !== ""
    ) {
      const exec = executions.find((e) => e.id === activeExecutionId);
      return exec?.status;
    }
    return activeExecution?.status;
  }, [activeExecutionId, executions, activeExecution]);
  activeWorkflowIdRef.current = activeWorkflowId;
  executionsRef.current = executions;
  activeExecutionIdRef.current = activeExecutionId;
  onExecutionStatusUpdateRef.current = onExecutionStatusUpdate;
  onExecutionLogUpdateRef.current = onExecutionLogUpdate;
  onExecutionNodeUpdateRef.current = onExecutionNodeUpdate;
  useLayoutEffect(() => {
    activeWorkflowIdRef.current = activeWorkflowId;
    activeExecutionIdRef.current = activeExecutionId;
    onExecutionStatusUpdateRef.current = onExecutionStatusUpdate;
    onExecutionLogUpdateRef.current = onExecutionLogUpdate;
    onExecutionNodeUpdateRef.current = onExecutionNodeUpdate;
  }, [
    activeWorkflowId,
    activeExecutionId,
    onExecutionStatusUpdate,
    onExecutionLogUpdate,
    onExecutionNodeUpdate,
  ]);
  useEffect(() => {
    activeWorkflowIdRef.current = activeWorkflowId;
  }, [activeWorkflowId]);
  useEffect(() => {
    activeExecutionIdRef.current = activeExecutionId;
  }, [activeExecutionId]);
  useEffect(() => {
    onExecutionStatusUpdateRef.current = onExecutionStatusUpdate;
  }, [onExecutionStatusUpdate]);
  useEffect(() => {
    onExecutionLogUpdateRef.current = onExecutionLogUpdate;
  }, [onExecutionLogUpdate]);
  useEffect(() => {
    onExecutionNodeUpdateRef.current = onExecutionNodeUpdate;
  }, [onExecutionNodeUpdate]);
  useWebSocket({
    executionId: activeExecutionId,
    executionStatus: activeExecutionStatus,
    authReady: Boolean(authToken),
    getAuthToken: () => authTokenRef.current ?? null,
    onLog: (log) => {
      const workflowId = activeWorkflowIdRef.current;
      const executionId = activeExecutionIdRef.current;
      const callback = onExecutionLogUpdateRef.current;
      if (workflowId && executionId && callback) {
        logger.debug("[ExecutionConsole] Received log via WebSocket:", log);
        callback(workflowId, executionId, log);
      }
    },
    onStatus: (status) => {
      const workflowStatus = normalizeExecutionStatusFromSocket(status);
      if (
        workflowStatus === "" ||
        isValidExecutionStatus(workflowStatus) !== true
      ) {
        return;
      }
      const workflowId = activeWorkflowIdRef.current;
      const executionId = activeExecutionIdRef.current;
      const callback = onExecutionStatusUpdateRef.current;
      const hasWorkflowId =
        workflowId !== null && workflowId !== void 0 && workflowId !== "";
      const hasExecutionId =
        executionId !== null && executionId !== void 0 && executionId !== "";
      const hasCallback =
        callback !== null &&
        callback !== void 0 &&
        typeof callback === "function";
      if (!hasWorkflowId || !hasExecutionId || !hasCallback) {
        logger.debug(
          "[ExecutionConsole] onStatus callback conditional check failed:",
          {
            workflowId,
            executionId,
            callback: callback ? "function" : callback,
            hasWorkflowId,
            hasExecutionId,
            hasCallback,
            workflowIdType: typeof workflowId,
            executionIdType: typeof executionId,
            callbackType: typeof callback,
          },
        );
      }
      if (hasWorkflowId && hasExecutionId && hasCallback) {
        logger.debug(
          "[ExecutionConsole] Received status update via WebSocket:",
          workflowStatus,
        );
        callback(workflowId, executionId, workflowStatus);
      } else {
        logger.debug(
          "[ExecutionConsole] Skipping status update - missing required values:",
          {
            hasWorkflowId,
            hasExecutionId,
            hasCallback,
            workflowId,
            executionId,
            callbackType: typeof callback,
            callbackValue: callback,
          },
        );
      }
    },
    onNodeUpdate: (nodeId, nodeState) => {
      const workflowId = activeWorkflowIdRef.current;
      const executionId = activeExecutionIdRef.current;
      const callback = onExecutionNodeUpdateRef.current;
      if (workflowId && executionId && callback) {
        logger.debug(
          "[ExecutionConsole] Received node update via WebSocket:",
          nodeId,
          nodeState,
        );
        callback(workflowId, executionId, nodeId, nodeState);
      }
    },
    onCompletion: (result) => {
      const workflowId = activeWorkflowIdRef.current;
      const executionId = activeExecutionIdRef.current;
      const callback = onExecutionStatusUpdateRef.current;
      if (workflowId && executionId && callback) {
        logger.debug(
          "[ExecutionConsole] Received completion via WebSocket:",
          result,
        );
        const { status, errorMessage: errMsg } =
          deriveExecutionCompletionFromWsResult(result);
        callback(workflowId, executionId, status, errMsg);
      }
    },
    onError: (error) => {
      logger.error("[ExecutionConsole] WebSocket error:", error);
      const workflowId = activeWorkflowIdRef.current;
      const executionId = activeExecutionIdRef.current;
      const callback = onExecutionStatusUpdateRef.current;
      if (workflowId && executionId && callback) {
        const detail = extractApiErrorMessage(
          error,
          "WebSocket connection error",
        );
        callback(workflowId, executionId, "failed", detail);
      }
    },
  });
  useEffect(() => {
    const id = activeExecutionId;
    if (id == null || id === "") {
      lastSyncedParentExecutionIdRef.current = undefined;
      return;
    }
    const list = executionsRef.current;
    if (!list.some((e) => e && String(e.id) === String(id))) {
      return;
    }
    if (lastSyncedParentExecutionIdRef.current === id) {
      return;
    }
    lastSyncedParentExecutionIdRef.current = id;
    setActiveTab(String(id));
    setIsExpanded(true);
  }, [activeExecutionId, executionIdsKey]);
  const handleCloseExecutionTab = (e, executionId) => {
    e.stopPropagation();
    if (
      onRemoveExecution !== null &&
      onRemoveExecution !== void 0 &&
      activeWorkflowId !== null &&
      activeWorkflowId !== void 0 &&
      activeWorkflowId !== ""
    ) {
      onRemoveExecution(activeWorkflowId, executionId);
      if (String(activeTab) === String(executionId)) {
        setActiveTab("chat");
      }
    }
  };
  useEffect(() => {
    if (documentAdapter === null || documentAdapter === void 0) return;
    const handleMouseMove = (e) => {
      if (isResizing.current) {
        const delta = startY.current - e.clientY;
        const newHeight = startHeight.current + delta;
        setHeight(Math.max(200, Math.min(600, newHeight)));
      }
    };
    const handleMouseUp = () => {
      isResizing.current = false;
      if (documentAdapter.body) {
        documentAdapter.body.style.cursor = "default";
        documentAdapter.body.style.userSelect = "auto";
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      }
    };
  }, [documentAdapter]);
  const handleMouseDown = (e) => {
    if (documentAdapter === null || documentAdapter === void 0) return;
    isResizing.current = true;
    startY.current = e.clientY;
    startHeight.current = height;
    if (documentAdapter.body) {
      documentAdapter.body.style.cursor = "ns-resize";
      documentAdapter.body.style.userSelect = "none";
    }
  };
  return (
    <ConsoleRoot
      style={{
        height: isExpanded ? `${height}px` : "auto",
        minHeight: "60px",
      }}
    >
      {isExpanded === true && (
        <ConsoleResizeHandle onMouseDown={handleMouseDown} />
      )}
      <ConsoleTabBar>
        <ConsoleTabScroll>
          {allTabs.map((tab) => (
            <ConsoleTabCluster
              key={tab.id}
              $active={activeTab === tab.id}
            >
              <ConsoleTabButton
                type="button"
                onClick={() => {
                  if (isExpanded === false) {
                    setIsExpanded(true);
                  }
                  setActiveTab(tab.id);
                  if (
                    tab.type === "execution" &&
                    onActiveExecutionChange != null &&
                    typeof onActiveExecutionChange === "function"
                  ) {
                    const raw = executions.find(
                      (e) => String(e?.id) === String(tab.id),
                    );
                    onActiveExecutionChange(
                      raw != null && raw.id != null ? raw.id : tab.id,
                    );
                  }
                }}
              >
                {tab.type === "chat" ? (
                  <>
                    <MessageSquare aria-hidden />
                    <ConsoleTabLabel>{tab.name}</ConsoleTabLabel>
                  </>
                ) : (
                  <>
                    <Play aria-hidden />
                    <ConsoleTabLabel>{tab.name}</ConsoleTabLabel>
                    {tab.execution?.status === "running" && (
                      <ConsoleStatusDot $pulse aria-hidden />
                    )}
                    {tab.execution?.status === "completed" && (
                      <ConsoleStatusDot aria-hidden />
                    )}
                    {tab.execution?.status === "failed" && (
                      <ConsoleStatusDot $variant="failed" aria-hidden />
                    )}
                  </>
                )}
              </ConsoleTabButton>
              {tab.type === "execution" && (
                <ConsoleTabClose
                  type="button"
                  onClick={(e) => handleCloseExecutionTab(e, tab.id)}
                  title="Close execution tab"
                >
                  <X aria-hidden />
                </ConsoleTabClose>
              )}
            </ConsoleTabCluster>
          ))}
        </ConsoleTabScroll>
        <ConsoleTabBarActions>
          <ConsoleExpandToggle
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronDown aria-hidden />
            ) : (
              <ChevronUp aria-hidden />
            )}
          </ConsoleExpandToggle>
        </ConsoleTabBarActions>
      </ConsoleTabBar>
      {isExpanded === true && (
        <ConsoleBody
          style={{
            height: `${height - 48}px`,
          }}
        >
          {activeTab === "chat" ? (
            <WorkflowChat
              key={
                workflowTabId !== null &&
                workflowTabId !== void 0 &&
                workflowTabId !== ""
                  ? workflowTabId
                  : `chat-${activeWorkflowId ?? "none"}`
              }
              workflowId={activeWorkflowId}
              tabId={workflowTabId}
              onWorkflowUpdate={onWorkflowUpdate}
              getCanvasSnapshot={getWorkflowChatCanvasSnapshot}
              chatClearNonce={workflowChatClearNonce}
            />
          ) : resolvedExecution ? (
            <ConsoleLogScroll>
              <ConsoleLogStack>
                <ConsoleLogHeaderRow>
                  <div>
                    <ConsoleLogTitle>
                      Execution {resolvedExecution.id.slice(0, 8)}...
                    </ConsoleLogTitle>
                    <ConsoleLogMeta>
                      Started:{" "}
                      {new Date(resolvedExecution.startedAt).toLocaleString()}
                    </ConsoleLogMeta>
                  </div>
                  <ExecutionStatusBadge status={resolvedExecution.status} />
                </ConsoleLogHeaderRow>
                {resolvedExecution.status === "failed" ? (
                  <ConsoleExecutionErrorPanel role="alert">
                    <ConsoleExecutionErrorLabel>
                      Failure reason
                    </ConsoleExecutionErrorLabel>
                    {resolveExecutionFailureDetail(resolvedExecution) ||
                      "No error message was reported. Check ERROR-level lines in the log below, or open this run in the Logs page for full details."}
                  </ConsoleExecutionErrorPanel>
                ) : null}
                {resolvedExecution.logs !== null &&
                resolvedExecution.logs !== void 0 &&
                resolvedExecution.logs.length > 0 ? (
                  <ConsoleLogEntries>
                    {resolvedExecution.logs.map((log, index) => (
                      <ConsoleLogEntry
                        key={index}
                        $tone={getLogLevelTone(
                          coalesceString(log.level, LOG_LEVELS.INFO),
                        )}
                      >
                        <ConsoleLogTime>
                          {new Date(
                            log.timestamp !== null && log.timestamp !== void 0
                              ? log.timestamp
                              : Date.now(),
                          ).toLocaleTimeString()}
                        </ConsoleLogTime>{" "}
                        <LogLevelBadge
                          level={coalesceString(log.level, LOG_LEVELS.INFO)}
                          showBackground={false}
                        />
                        {log.node_id !== null &&
                          log.node_id !== void 0 &&
                          log.node_id !== "" && (
                            <ConsoleLogNodeRef>
                              {" "}
                              [{log.node_id}]
                            </ConsoleLogNodeRef>
                          )}{" "}
                        {coalesceString(log.message, JSON.stringify(log))}
                      </ConsoleLogEntry>
                    ))}
                  </ConsoleLogEntries>
                ) : (
                  <ConsoleEmptyState $tone="soft">
                    No logs yet. Execution is starting...
                  </ConsoleEmptyState>
                )}
              </ConsoleLogStack>
            </ConsoleLogScroll>
          ) : (
            <ConsoleLogScroll>
              <ConsoleEmptyState>Execution not found</ConsoleEmptyState>
            </ConsoleLogScroll>
          )}
        </ConsoleBody>
      )}
    </ConsoleRoot>
  );
}

ExecutionConsole.propTypes = {
  workflowContext: PropTypes.shape({
    activeWorkflowId: nullableString,
    workflowTabId: nullableString,
  }).isRequired,
  executionsState: PropTypes.shape({
    executions: PropTypes.arrayOf(PropTypes.object),
    activeExecutionId: nullableString,
  }).isRequired,
  chatBridge: PropTypes.shape({
    onWorkflowUpdate: PropTypes.func,
    getWorkflowChatCanvasSnapshot: PropTypes.func,
    workflowChatClearNonce: PropTypes.number,
  }).isRequired,
  executionCallbacks: PropTypes.shape({
    onExecutionLogUpdate: PropTypes.func,
    onExecutionStatusUpdate: PropTypes.func,
    onExecutionNodeUpdate: PropTypes.func,
    onRemoveExecution: PropTypes.func,
    onActiveExecutionChange: PropTypes.func,
  }).isRequired,
  environment: PropTypes.shape({
    documentAdapter: PropTypes.object,
  }),
};

export { ExecutionConsole as default };
