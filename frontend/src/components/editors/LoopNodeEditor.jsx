import { useRef, useState, useEffect } from "react";
function LoopNodeEditor({ node, onUpdate, onConfigUpdate }) {
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
  return (
    <>
      <div>
        <label
          htmlFor="loop-type"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Loop Type
        </label>
        <select
          id="loop-type"
          value={loopType}
          onChange={(e) => {
            const currentLoopConfig = loopConfig;
            onUpdate("loop_config", {
              loop_type: e.target.value,
              max_iterations: currentLoopConfig.max_iterations ?? 0,
              items_source: currentLoopConfig.items_source,
              condition: currentLoopConfig.condition,
            });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="Select loop type"
        >
          <option value="for_each">For Each</option>
          <option value="while">While</option>
          <option value="until">Until</option>
        </select>
      </div>
      <div className="mt-4">
        <label
          htmlFor="loop-max-iterations"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Max Iterations
        </label>
        <input
          id="loop-max-iterations"
          ref={loopMaxIterationsRef}
          type="number"
          min="0"
          value={loopMaxIterationsValue}
          onChange={(e) => {
            const newValue = parseInt(e.target.value) || 0;
            setLoopMaxIterationsValue(newValue);
            onConfigUpdate("loop_config", "max_iterations", newValue);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="Maximum number of loop iterations"
          aria-describedby="max-iterations-help"
        />
        <p id="max-iterations-help" className="text-xs text-gray-500 mt-1">
          Maximum number of times the loop will execute (0 = unlimited)
        </p>
      </div>
    </>
  );
}
export { LoopNodeEditor as default };
