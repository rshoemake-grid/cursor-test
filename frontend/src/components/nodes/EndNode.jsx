import { jsx, jsxs } from "react/jsx-runtime";
import { Handle, Position } from "@xyflow/react";
import { Flag } from "lucide-react";
function EndNode({ selected }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 border-2 ${selected ? "border-gray-800 border-4 shadow-xl ring-2 ring-gray-300" : "border-gray-700"}`,
      children: [
        /* @__PURE__ */ jsx(Handle, { type: "target", position: Position.Top, className: "w-3 h-3" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Flag, { className: "w-4 h-4 text-white" }),
          /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm text-white", children: "End" })
        ] })
      ]
    }
  );
}
export {
  EndNode as default
};
