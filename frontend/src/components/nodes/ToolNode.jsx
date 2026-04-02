import { jsx, jsxs } from "react/jsx-runtime";
import { Handle, Position } from "@xyflow/react";
import { Wrench } from "lucide-react";
function ToolNode({ data, selected }) {
  const executionStatus = data.executionStatus;
  const hasError = executionStatus === "failed";
  const toolName = data.tool_config?.tool_name || data.tool_name || "Tool";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `relative px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[200px] max-w-[200px] ${hasError ? "border-red-500 border-4 shadow-xl ring-2 ring-red-200" : selected ? "border-primary-500 border-4 shadow-xl ring-2 ring-primary-200" : "border-gray-300"}`,
      children: [
        /* @__PURE__ */ jsx(Handle, { type: "target", position: Position.Top, id: "target-top", className: "w-3 h-3" }),
        /* @__PURE__ */ jsx(Handle, { type: "target", position: Position.Left, id: "target-left", className: "w-3 h-3" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 rounded flex-shrink-0", children: /* @__PURE__ */ jsx(Wrench, { className: "w-4 h-4 text-amber-600" }) }),
          /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm text-gray-900 truncate flex-1 min-w-0", children: String(data.label || toolName) })
        ] }),
        data.description != null && /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500 mb-2 line-clamp-2 overflow-hidden", children: String(data.description) }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded truncate", children: toolName }),
        /* @__PURE__ */ jsx(Handle, { type: "source", position: Position.Bottom, id: "source-bottom", className: "w-3 h-3" }),
        /* @__PURE__ */ jsx(Handle, { type: "source", position: Position.Right, id: "source-right", className: "w-3 h-3" })
      ]
    }
  );
}
export {
  ToolNode as default
};
