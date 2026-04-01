import { jsx, jsxs } from "react/jsx-runtime";
import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";
function ConditionNode({ data, selected }) {
  const executionStatus = data.executionStatus;
  const hasError = executionStatus === "failed";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[180px] max-w-[180px] ${hasError ? "border-red-500 border-4 shadow-xl ring-2 ring-red-200" : selected ? "border-primary-500 border-4 shadow-xl ring-2 ring-primary-200" : "border-gray-300"}`,
      children: [
        /* @__PURE__ */ jsx(Handle, { type: "target", position: Position.Top, className: "w-3 h-3" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-purple-100 rounded flex-shrink-0", children: /* @__PURE__ */ jsx(GitBranch, { className: "w-4 h-4 text-purple-600" }) }),
          /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm text-gray-900 truncate flex-1 min-w-0", children: String(data.label || "") })
        ] }),
        data.description && /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500 mb-2 line-clamp-2 overflow-hidden", children: String(data.description) }),
        data.condition_config?.condition_type && /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded truncate mb-2", children: [
          data.condition_config.condition_type,
          ": ",
          data.condition_config.field
        ] }),
        /* @__PURE__ */ jsx("div", { className: "relative mt-2 pt-2 border-t border-gray-200", children: /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center flex-1 relative", children: [
            /* @__PURE__ */ jsx(
              Handle,
              {
                type: "source",
                position: Position.Bottom,
                id: "true",
                style: { left: "25%" },
                className: "w-3 h-3 !bg-green-500 !border-green-600"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-green-600 mt-1", children: "True" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center flex-1 relative", children: [
            /* @__PURE__ */ jsx(
              Handle,
              {
                type: "source",
                position: Position.Bottom,
                id: "false",
                style: { left: "75%" },
                className: "w-3 h-3 !bg-red-500 !border-red-600"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-red-600 mt-1", children: "False" })
          ] })
        ] }) })
      ]
    }
  );
}
export {
  ConditionNode as default
};
