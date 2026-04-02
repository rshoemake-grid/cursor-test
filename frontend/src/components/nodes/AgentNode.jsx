import { jsx, jsxs } from "react/jsx-runtime";
import { Handle, Position } from "@xyflow/react";
import { Bot } from "lucide-react";
function AgentNode({ data, selected }) {
  const executionStatus = data.executionStatus;
  const hasError = executionStatus === "failed";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `relative px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[200px] max-w-[200px] ${hasError ? "border-red-500 border-4 shadow-xl ring-2 ring-red-200" : selected ? "border-primary-500 border-4 shadow-xl ring-2 ring-primary-200" : "border-gray-300"}`,
      children: [
        /* @__PURE__ */ jsx(Handle, { type: "target", position: Position.Top, id: "target-top", className: "w-3 h-3" }),
        /* @__PURE__ */ jsx(Handle, { type: "target", position: Position.Left, id: "target-left", className: "w-3 h-3" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 rounded flex-shrink-0", children: /* @__PURE__ */ jsx(Bot, { className: "w-4 h-4 text-blue-600" }) }),
          /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm text-gray-900 truncate flex-1 min-w-0", children: String(data.label || "") })
        ] }),
        data.description && /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500 mb-2 line-clamp-2 overflow-hidden", children: String(data.description) }),
        data.agent_config?.model && /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded truncate", children: data.agent_config.model }),
        /* @__PURE__ */ jsx(Handle, { type: "source", position: Position.Bottom, id: "source-bottom", className: "w-3 h-3" }),
        /* @__PURE__ */ jsx(Handle, { type: "source", position: Position.Right, id: "source-right", className: "w-3 h-3" })
      ]
    }
  );
}
export {
  AgentNode as default
};
