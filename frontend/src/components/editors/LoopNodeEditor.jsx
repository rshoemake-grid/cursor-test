import { useRef, useState, useEffect } from "react";
import {
  EditorFieldGroup,
  EditorLabel,
  EditorSelect,
  EditorInput,
  EditorHint,
} from "../../styles/editorForm.styled";
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
      <EditorFieldGroup>
        <EditorLabel htmlFor="loop-type">Loop Type</EditorLabel>
        <EditorSelect
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
          aria-label="Select loop type"
        >
          <option value="for_each">For Each</option>
          <option value="while">While</option>
          <option value="until">Until</option>
        </EditorSelect>
      </EditorFieldGroup>
      <EditorFieldGroup $mt="md">
        <EditorLabel htmlFor="loop-max-iterations">Max Iterations</EditorLabel>
        <EditorInput
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
          aria-label="Maximum number of loop iterations"
          aria-describedby="max-iterations-help"
        />
        <EditorHint id="max-iterations-help">
          Maximum number of times the loop will execute (0 = unlimited)
        </EditorHint>
      </EditorFieldGroup>
    </>
  );
}
export { LoopNodeEditor as default };
