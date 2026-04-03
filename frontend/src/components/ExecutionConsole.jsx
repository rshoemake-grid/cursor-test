import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, MessageSquare, Play, X } from "lucide-react";
import WorkflowChat from "./WorkflowChat";
import { useWebSocket } from "../hooks/execution";
import { useAuth } from "../contexts/AuthContext";
import ExecutionStatusBadge from "./ExecutionStatusBadge";
import LogLevelBadge from "./LogLevelBadge";
import { logger } from "../utils/logger";
import { getLogLevelColor } from "../utils/logLevel";
import { defaultAdapters } from "../types/adapters";
import { coalesceString } from "../utils/nullCoalescing";
import { LOG_LEVELS } from "../constants/stringLiterals";
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
    <div
      className="relative w-full bg-gray-900 text-gray-100 shadow-2xl border-t-2 border-gray-700 flex-shrink-0"
      style={{
        height: isExpanded ? `${height}px` : "auto",
        minHeight: "60px",
      }}
    >
      {isExpanded === true && (
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500 transition-colors"
          onMouseDown={handleMouseDown}
        />
      )}
      <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between bg-gray-800">
        <div className="flex items-center gap-2 overflow-x-auto flex-1">
          {allTabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center gap-1 px-3 py-1 rounded transition-colors relative group ${activeTab === tab.id ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
            >
              <button
                onClick={() => {
                  if (isExpanded === false) {
                    setIsExpanded(true);
                  }
                  setActiveTab(tab.id);
                }}
                className="flex items-center gap-2"
              >
                {tab.type === "chat" ? (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span className="font-semibold text-sm whitespace-nowrap">
                      {tab.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span className="font-semibold text-sm whitespace-nowrap">
                      {tab.name}
                    </span>
                    {tab.execution?.status === "running" && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                    {tab.execution?.status === "completed" && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                    )}
                    {tab.execution?.status === "failed" && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </>
                )}
              </button>
              {tab.type === "execution" && (
                <button
                  onClick={(e) => handleCloseExecutionTab(e, tab.id)}
                  className="opacity-0 group-hover:opacity-100 hover:bg-gray-600 rounded p-0.5 transition-opacity ml-1"
                  title="Close execution tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      {isExpanded === true && (
        <div
          className="overflow-hidden"
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
            <div className="h-full overflow-y-auto bg-gray-900 text-gray-100 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Execution {activeExecution.id.slice(0, 8)}...
                    </h3>
                    <p className="text-sm text-gray-400">
                      Started:{" "}
                      {new Date(activeExecution.startedAt).toLocaleString()}
                    </p>
                  </div>
                  <ExecutionStatusBadge status={activeExecution.status} />
                </div>
                {activeExecution.logs !== null &&
                activeExecution.logs !== void 0 &&
                activeExecution.logs.length > 0 ? (
                  <div className="space-y-1 font-mono text-xs">
                    {activeExecution.logs.map((log, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded ${getLogLevelColor(coalesceString(log.level, LOG_LEVELS.INFO))}`}
                      >
                        <span className="text-gray-500">
                          {new Date(
                            log.timestamp !== null && log.timestamp !== void 0
                              ? log.timestamp
                              : Date.now(),
                          ).toLocaleTimeString()}
                        </span>{" "}
                        <LogLevelBadge
                          level={coalesceString(log.level, LOG_LEVELS.INFO)}
                          showBackground={false}
                        />
                        {log.node_id !== null &&
                          log.node_id !== void 0 &&
                          log.node_id !== "" && (
                            <span className="text-gray-500">
                              {" "}
                              [{log.node_id}]
                            </span>
                          )}{" "}
                        {coalesceString(log.message, JSON.stringify(log))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    No logs yet. Execution is starting...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto bg-gray-900 text-gray-100 p-4">
              <div className="text-gray-400 text-center py-8">
                Execution not found
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export { ExecutionConsole as default };
