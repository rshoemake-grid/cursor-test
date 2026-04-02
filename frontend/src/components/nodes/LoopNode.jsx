import { jsx, jsxs } from "react/jsx-runtime";
import { Handle, Position } from "@xyflow/react";
import { RotateCw } from "lucide-react";
function LoopNode({ data, selected }) {
  const executionStatus = data.executionStatus;
  const hasError = executionStatus === "failed";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `relative px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[180px] max-w-[180px] ${hasError ? "border-red-500 border-4 shadow-xl ring-2 ring-red-200" : selected ? "border-primary-500 border-4 shadow-xl ring-2 ring-primary-200" : "border-gray-300"}`,
      children: [
        /* @__PURE__ */ jsx(Handle, { type: "target", position: Position.Top, id: "target-top", className: "w-3 h-3" }),
        /* @__PURE__ */ jsx(Handle, { type: "target", position: Position.Left, id: "target-left", className: "w-3 h-3" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-green-100 rounded flex-shrink-0", children: /* @__PURE__ */ jsx(RotateCw, { className: "w-4 h-4 text-green-600" }) }),
          /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm text-gray-900 truncate flex-1 min-w-0", children: String(data.label || "") })
        ] }),
        data.description && /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500 mb-2 line-clamp-2 overflow-hidden", children: String(data.description) }),
        data.loop_config?.loop_type && /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded truncate", children: [
          data.loop_config.loop_type,
          data.loop_config.max_iterations && ` (max: ${data.loop_config.max_iterations})`
        ] }),
        /* @__PURE__ */ jsx(Handle, { type: "source", position: Position.Bottom, id: "source-bottom", className: "w-3 h-3" }),
        /* @__PURE__ */ jsx(Handle, { type: "source", position: Position.Right, id: "source-right", className: "w-3 h-3" })
      ]
    }
  );
}
export {
  LoopNode as default
};
