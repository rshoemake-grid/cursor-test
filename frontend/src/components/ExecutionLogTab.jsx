import { jsx, jsxs } from "react/jsx-runtime";
import { Clock, CheckCircle, XCircle, Play, AlertCircle } from "lucide-react";
import ExecutionStatusBadge from "./ExecutionStatusBadge";
function ExecutionLogTab({
  executions,
  onExecutionClick
}) {
  const sortedExecutions = [...executions].sort((a, b) => {
    const aTime = new Date(a.startedAt).getTime();
    const bTime = new Date(b.startedAt).getTime();
    return bTime - aTime;
  });
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-green-500" });
      case "failed":
        return /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4 text-red-500" });
      case "running":
        return /* @__PURE__ */ jsx(Play, { className: "w-4 h-4 text-blue-500 animate-pulse" });
      case "pending":
        return /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-yellow-500" });
      default:
        return /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 text-gray-500" });
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
      const completedNodes = nodeEntries.filter(([_, state]) => {
        if (state && typeof state === "object" && "status" in state) {
          return state.status === "completed";
        }
        return false;
      }).sort(([_, a], [__, b]) => {
        const aState = a;
        const bState = b;
        const aTime = aState?.completed_at ? new Date(aState.completed_at).getTime() : 0;
        const bTime = bState?.completed_at ? new Date(bState.completed_at).getTime() : 0;
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
      const minutes = Math.floor(duration % 3600 / 60);
      return `${hours}h ${minutes}m`;
    }
  };
  if (sortedExecutions.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "h-full overflow-y-auto bg-gray-900 text-gray-100 p-4", children: /* @__PURE__ */ jsxs("div", { className: "text-gray-400 text-center py-8", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "w-12 h-12 mx-auto mb-4 opacity-50" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg font-medium mb-2", children: "No executions yet" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Execute a workflow to see execution logs here" })
    ] }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "h-full overflow-y-auto bg-gray-900 text-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-white mb-1", children: "Execution Log" }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-400", children: [
        sortedExecutions.length,
        " execution",
        sortedExecutions.length !== 1 ? "s" : "",
        " total"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2", children: sortedExecutions.map((execution) => {
      const currentNode = getCurrentNode(execution);
      const isActive = execution.status === "running" || execution.status === "pending";
      return /* @__PURE__ */ jsx(
        "div",
        {
          onClick: () => onExecutionClick?.(execution.id),
          className: `
                  bg-gray-800 rounded-lg p-4 border transition-all cursor-pointer
                  ${isActive ? "border-blue-500 hover:border-blue-400" : "border-gray-700 hover:border-gray-600"}
                  hover:bg-gray-700
                `,
          title: `Click to view execution ${execution.id.slice(0, 8)}...`,
          children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                getStatusIcon(execution.status),
                /* @__PURE__ */ jsxs("span", { className: "font-mono text-sm text-gray-300", children: [
                  execution.id.slice(0, 8),
                  "..."
                ] }),
                /* @__PURE__ */ jsx(ExecutionStatusBadge, { status: execution.status, variant: "light" })
              ] }),
              currentNode && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500", children: "Current Node:" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-300", children: currentNode })
              ] }),
              execution.status === "running" && execution.nodes && typeof execution.nodes === "object" && /* @__PURE__ */ jsx("div", { className: "mb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-gray-400", children: [
                /* @__PURE__ */ jsx("span", { children: "Progress:" }),
                /* @__PURE__ */ jsx("div", { className: "flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden", children: (() => {
                  const nodeEntries = Object.entries(execution.nodes);
                  const totalNodes = nodeEntries.length;
                  const completedNodes = nodeEntries.filter(([_, state]) => {
                    if (state && typeof state === "object" && "status" in state) {
                      return state.status === "completed";
                    }
                    return false;
                  }).length;
                  const progress = totalNodes > 0 ? completedNodes / totalNodes * 100 : 0;
                  return /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "bg-blue-500 h-full transition-all duration-300",
                      style: { width: `${Math.min(progress, 100)}%` }
                    }
                  );
                })() })
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 text-xs text-gray-500", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3 flex-shrink-0" }),
                  /* @__PURE__ */ jsxs("span", { className: "whitespace-nowrap", children: [
                    "Started: ",
                    new Date(execution.startedAt).toLocaleString()
                  ] })
                ] }),
                execution.completedAt && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3 flex-shrink-0" }),
                  /* @__PURE__ */ jsxs("span", { className: "whitespace-nowrap", children: [
                    "Completed: ",
                    new Date(execution.completedAt).toLocaleString()
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-gray-600 whitespace-nowrap", children: [
                  "Duration: ",
                  formatDuration(execution.startedAt, execution.completedAt)
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-2 flex-shrink-0", children: [
              execution.status === "completed" && /* @__PURE__ */ jsx("div", { className: "text-xs text-green-400 font-medium", children: "\u2713 Completed" }),
              execution.status === "failed" && /* @__PURE__ */ jsx("div", { className: "text-xs text-red-400 font-medium", children: "\u2717 Failed" }),
              isActive && /* @__PURE__ */ jsx("div", { className: "text-xs text-blue-400 font-medium animate-pulse", children: "\u25CF In Progress" })
            ] })
          ] })
        },
        execution.id
      );
    }) })
  ] }) });
}
export {
  ExecutionLogTab as default
};
