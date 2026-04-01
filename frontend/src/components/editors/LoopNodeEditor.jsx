import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useRef, useState, useEffect } from "react";
function LoopNodeEditor({
  node,
  onUpdate,
  onConfigUpdate
}) {
  const loopMaxIterationsRef = useRef(null);
  const [loopMaxIterationsValue, setLoopMaxIterationsValue] = useState(10);
  useEffect(() => {
    const loopConfig2 = node.data.loop_config || {};
    if (document.activeElement !== loopMaxIterationsRef.current) {
      setLoopMaxIterationsValue(loopConfig2.max_iterations ?? 0);
    }
  }, [node.data.loop_config]);
  const loopConfig = node.data.loop_config || {};
  const loopType = loopConfig.loop_type || "for_each";
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(
        "label",
        {
          htmlFor: "loop-type",
          className: "block text-sm font-medium text-gray-700 mb-1",
          children: "Loop Type"
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          id: "loop-type",
          value: loopType,
          onChange: (e) => {
            const currentLoopConfig = loopConfig;
            onUpdate("loop_config", {
              loop_type: e.target.value,
              max_iterations: currentLoopConfig.max_iterations ?? 0,
              items_source: currentLoopConfig.items_source,
              condition: currentLoopConfig.condition
            });
          },
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
          "aria-label": "Select loop type",
          children: [
            /* @__PURE__ */ jsx("option", { value: "for_each", children: "For Each" }),
            /* @__PURE__ */ jsx("option", { value: "while", children: "While" }),
            /* @__PURE__ */ jsx("option", { value: "until", children: "Until" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
      /* @__PURE__ */ jsx(
        "label",
        {
          htmlFor: "loop-max-iterations",
          className: "block text-sm font-medium text-gray-700 mb-1",
          children: "Max Iterations"
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "loop-max-iterations",
          ref: loopMaxIterationsRef,
          type: "number",
          min: "0",
          value: loopMaxIterationsValue,
          onChange: (e) => {
            const newValue = parseInt(e.target.value) || 0;
            setLoopMaxIterationsValue(newValue);
            onConfigUpdate("loop_config", "max_iterations", newValue);
          },
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
          "aria-label": "Maximum number of loop iterations",
          "aria-describedby": "max-iterations-help"
        }
      ),
      /* @__PURE__ */ jsx("p", { id: "max-iterations-help", className: "text-xs text-gray-500 mt-1", children: "Maximum number of times the loop will execute (0 = unlimited)" })
    ] })
  ] });
}
export {
  LoopNodeEditor as default
};
