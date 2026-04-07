import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, MessageSquare, Play, X } from "lucide-react";
import WorkflowChat from "./WorkflowChat";
import { useWebSocket } from "../hooks/execution";
import { useAuth } from "../contexts/AuthContext";
import ExecutionStatusBadge from "./ExecutionStatusBadge";
import LogLevelBadge from "./LogLevelBadge";
import { logger } from "../utils/logger";
import { getLogLevelTone } from "../utils/logLevel";
import { defaultAdapters } from "../types/adapters";
import { coalesceString } from "../utils/nullCoalescing";
import { LOG_LEVELS } from "../constants/stringLiterals";
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
  ConsoleLogEntries,
  ConsoleLogEntry,
  ConsoleLogTime,
  ConsoleLogNodeRef,
} from "../styles/executionConsole.styled";
function ExecutionConsole({
  activeWorkflowId,
  workflowTabId = null,
  executions = [],
  activeExecutionId = null,
  onWorkflowUpdate,
  getWorkflowChatCanvasSnapshot = null,
  workflowChatClearNonce = 0,
  onExecutionLogUpdate,
  onExecutionStatusUpdate,
  onExecutionNodeUpdate,
  onRemoveExecution,
  documentAdapter = defaultAdapters.createDocumentAdapter(),
}) {
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
        id: exec.id,
        name: exec.id.slice(0, 8),
        type: "execution",
        execution: exec,
      })),
    ],
    [executions],
  );
  const activeTabData = useMemo(
    () => allTabs.find((t) => t.id === activeTab),
    [allTabs, activeTab],
  );
  const activeExecution =
    activeTabData?.type === "execution" ? activeTabData.execution : null;
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
          status,
        );
        callback(workflowId, executionId, status);
      }
      if (!hasWorkflowId || !hasExecutionId || !hasCallback) {
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
      if (hasWorkflowId && hasExecutionId && hasCallback) {
        logger.debug(
          "[ExecutionConsole] Received status update via WebSocket:",
          status,
        );
        callback(workflowId, executionId, status);
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
        callback(workflowId, executionId, "completed");
      }
    },
    onError: (error) => {
      logger.error("[ExecutionConsole] WebSocket error:", error);
      const workflowId = activeWorkflowIdRef.current;
      const executionId = activeExecutionIdRef.current;
      const callback = onExecutionStatusUpdateRef.current;
      if (workflowId && executionId && callback) {
        callback(workflowId, executionId, "failed");
      }
    },
  });
  useEffect(() => {
    if (
      activeExecutionId !== null &&
      activeExecutionId !== void 0 &&
      activeExecutionId !== "" &&
      executions.length > 0
    ) {
      setActiveTab(activeExecutionId);
      if (isExpanded === false) {
        setIsExpanded(true);
      }
    }
  }, [activeExecutionId, executions.length]);
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
      if (activeTab === executionId) {
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
          ) : activeExecution ? (
            <ConsoleLogScroll>
              <ConsoleLogStack>
                <ConsoleLogHeaderRow>
                  <div>
                    <ConsoleLogTitle>
                      Execution {activeExecution.id.slice(0, 8)}...
                    </ConsoleLogTitle>
                    <ConsoleLogMeta>
                      Started:{" "}
                      {new Date(activeExecution.startedAt).toLocaleString()}
                    </ConsoleLogMeta>
                  </div>
                  <ExecutionStatusBadge status={activeExecution.status} />
                </ConsoleLogHeaderRow>
                {activeExecution.logs !== null &&
                activeExecution.logs !== void 0 &&
                activeExecution.logs.length > 0 ? (
                  <ConsoleLogEntries>
                    {activeExecution.logs.map((log, index) => (
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
export { ExecutionConsole as default };
