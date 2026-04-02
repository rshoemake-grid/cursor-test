import { jsx, jsxs } from "react/jsx-runtime";
import { Handle, Position } from "@xyflow/react";
import { Play } from "lucide-react";
function StartNode({ selected }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `relative px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 border-2 ${selected ? "border-primary-700 border-4 shadow-xl ring-2 ring-primary-200" : "border-primary-600"}`,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Play, { className: "w-4 h-4 text-white" }),
          /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm text-white", children: "Start" })
        ] }),
        /* @__PURE__ */ jsx(Handle, { type: "source", position: Position.Bottom, id: "source-bottom", className: "w-3 h-3" }),
        /* @__PURE__ */ jsx(Handle, { type: "source", position: Position.Right, id: "source-right", className: "w-3 h-3" })
      ]
    }
  );
}
export {
  StartNode as default
};
