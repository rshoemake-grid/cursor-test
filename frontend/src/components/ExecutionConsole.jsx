import { Fragment, jsx, jsxs } from "react/jsx-runtime";
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
  onExecutionLogUpdate,
  onExecutionStatusUpdate,
  onExecutionNodeUpdate,
  onRemoveExecution,
  documentAdapter = defaultAdapters.createDocumentAdapter()
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
  const allTabs = useMemo(() => [
    { id: "chat", name: "Chat", type: "chat" },
    ...executions.map((exec) => ({
      id: exec.id,
      name: exec.id.slice(0, 8),
      type: "execution",
      execution: exec
    }))
  ], [executions]);
  const activeTabData = useMemo(
    () => allTabs.find((t) => t.id === activeTab),
    [allTabs, activeTab]
  );
  const activeExecution = activeTabData?.type === "execution" ? activeTabData.execution : null;
  const activeExecutionStatus = useMemo(() => {
    if (activeExecutionId !== null && activeExecutionId !== void 0 && activeExecutionId !== "") {
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
  }, [activeWorkflowId, activeExecutionId, onExecutionStatusUpdate, onExecutionLogUpdate, onExecutionNodeUpdate]);
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
      const hasWorkflowId = workflowId !== null && workflowId !== void 0 && workflowId !== "";
      const hasExecutionId = executionId !== null && executionId !== void 0 && executionId !== "";
      const hasCallback = callback !== null && callback !== void 0 && typeof callback === "function";
      if (!hasWorkflowId || !hasExecutionId || !hasCallback) {
        logger.debug("[ExecutionConsole] onStatus callback conditional check failed:", {
          workflowId,
          executionId,
          callback: callback ? "function" : callback,
          hasWorkflowId,
          hasExecutionId,
          hasCallback,
          workflowIdType: typeof workflowId,
          executionIdType: typeof executionId,
          callbackType: typeof callback
        });
      }
      if (hasWorkflowId && hasExecutionId && hasCallback) {
        logger.debug("[ExecutionConsole] Received status update via WebSocket:", status);
        callback(workflowId, executionId, status);
      }
      if (!hasWorkflowId || !hasExecutionId || !hasCallback) {
        logger.debug("[ExecutionConsole] Skipping status update - missing required values:", {
          hasWorkflowId,
          hasExecutionId,
          hasCallback,
          workflowId,
          executionId,
          callbackType: typeof callback,
          callbackValue: callback
        });
      }
      if (hasWorkflowId && hasExecutionId && hasCallback) {
        logger.debug("[ExecutionConsole] Received status update via WebSocket:", status);
        callback(workflowId, executionId, status);
      }
    },
    onNodeUpdate: (nodeId, nodeState) => {
      const workflowId = activeWorkflowIdRef.current;
      const executionId = activeExecutionIdRef.current;
      const callback = onExecutionNodeUpdateRef.current;
      if (workflowId && executionId && callback) {
        logger.debug("[ExecutionConsole] Received node update via WebSocket:", nodeId, nodeState);
        callback(workflowId, executionId, nodeId, nodeState);
      }
    },
    onCompletion: (result) => {
      const workflowId = activeWorkflowIdRef.current;
      const executionId = activeExecutionIdRef.current;
      const callback = onExecutionStatusUpdateRef.current;
      if (workflowId && executionId && callback) {
        logger.debug("[ExecutionConsole] Received completion via WebSocket:", result);
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
    }
  });
  useEffect(() => {
    if (activeExecutionId !== null && activeExecutionId !== void 0 && activeExecutionId !== "" && executions.length > 0) {
      setActiveTab(activeExecutionId);
      if (isExpanded === false) {
        setIsExpanded(true);
      }
    }
  }, [activeExecutionId, executions.length]);
  const handleCloseExecutionTab = (e, executionId) => {
    e.stopPropagation();
    if (onRemoveExecution !== null && onRemoveExecution !== void 0 && (activeWorkflowId !== null && activeWorkflowId !== void 0 && activeWorkflowId !== "")) {
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
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "relative w-full bg-gray-900 text-gray-100 shadow-2xl border-t-2 border-gray-700 flex-shrink-0",
      style: { height: isExpanded ? `${height}px` : "auto", minHeight: "60px" },
      children: [
        isExpanded === true && /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500 transition-colors",
            onMouseDown: handleMouseDown
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "px-4 py-2 border-b border-gray-800 flex items-center justify-between bg-gray-800", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 overflow-x-auto flex-1", children: allTabs.map((tab) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: `flex items-center gap-1 px-3 py-1 rounded transition-colors relative group ${activeTab === tab.id ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"}`,
              children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => {
                      if (isExpanded === false) {
                        setIsExpanded(true);
                      }
                      setActiveTab(tab.id);
                    },
                    className: "flex items-center gap-2",
                    children: tab.type === "chat" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx(MessageSquare, { className: "w-4 h-4" }),
                      /* @__PURE__ */ jsx("span", { className: "font-semibold text-sm whitespace-nowrap", children: tab.name })
                    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx(Play, { className: "w-4 h-4" }),
                      /* @__PURE__ */ jsx("span", { className: "font-semibold text-sm whitespace-nowrap", children: tab.name }),
                      tab.execution?.status === "running" && /* @__PURE__ */ jsx("div", { className: "absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" }),
                      tab.execution?.status === "completed" && /* @__PURE__ */ jsx("div", { className: "absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" }),
                      tab.execution?.status === "failed" && /* @__PURE__ */ jsx("div", { className: "absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" })
                    ] })
                  }
                ),
                tab.type === "execution" && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: (e) => handleCloseExecutionTab(e, tab.id),
                    className: "opacity-0 group-hover:opacity-100 hover:bg-gray-600 rounded p-0.5 transition-opacity ml-1",
                    title: "Close execution tab",
                    children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
                  }
                )
              ]
            },
            tab.id
          )) }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 flex-shrink-0", children: /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setIsExpanded(!isExpanded),
              className: "text-gray-400 hover:text-white transition-colors",
              children: isExpanded ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(ChevronUp, { className: "w-4 h-4" })
            }
          ) })
        ] }),
        isExpanded === true && /* @__PURE__ */ jsx("div", { className: "overflow-hidden", style: { height: `${height - 48}px` }, children: activeTab === "chat" ? /* @__PURE__ */ jsx(
          WorkflowChat,
          {
            workflowId: activeWorkflowId,
            tabId: workflowTabId,
            onWorkflowUpdate,
            getCanvasSnapshot: getWorkflowChatCanvasSnapshot
          },
          workflowTabId !== null && workflowTabId !== void 0 && workflowTabId !== "" ? workflowTabId : `chat-${activeWorkflowId ?? "none"}`
        ) : activeExecution ? /* @__PURE__ */ jsx("div", { className: "h-full overflow-y-auto bg-gray-900 text-gray-100 p-4", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold", children: [
                "Execution ",
                activeExecution.id.slice(0, 8),
                "..."
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-400", children: [
                "Started: ",
                new Date(activeExecution.startedAt).toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsx(ExecutionStatusBadge, { status: activeExecution.status })
          ] }),
          activeExecution.logs !== null && activeExecution.logs !== void 0 && activeExecution.logs.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-1 font-mono text-xs", children: activeExecution.logs.map((log, index) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: `p-2 rounded ${getLogLevelColor(coalesceString(log.level, LOG_LEVELS.INFO))}`,
              children: [
                /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: new Date(log.timestamp !== null && log.timestamp !== void 0 ? log.timestamp : Date.now()).toLocaleTimeString() }),
                " ",
                /* @__PURE__ */ jsx(LogLevelBadge, { level: coalesceString(log.level, LOG_LEVELS.INFO), showBackground: false }),
                log.node_id !== null && log.node_id !== void 0 && log.node_id !== "" && /* @__PURE__ */ jsxs("span", { className: "text-gray-500", children: [
                  " [",
                  log.node_id,
                  "]"
                ] }),
                " ",
                coalesceString(log.message, JSON.stringify(log))
              ]
            },
            index
          )) }) : /* @__PURE__ */ jsx("div", { className: "text-gray-500 text-center py-8", children: "No logs yet. Execution is starting..." })
        ] }) }) : /* @__PURE__ */ jsx("div", { className: "h-full overflow-y-auto bg-gray-900 text-gray-100 p-4", children: /* @__PURE__ */ jsx("div", { className: "text-gray-400 text-center py-8", children: "Execution not found" }) }) })
      ]
    }
  );
}
export {
  ExecutionConsole as default
};
