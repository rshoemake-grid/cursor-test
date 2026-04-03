import { useState, useEffect, useRef, useCallback } from "react";
import { getNestedValue } from "../utils/formUtils";
import { nullishCoalesce } from "../utils/nullishCoalescing";
function useFormField(options) {
  const {
    initialValue,
    onUpdate,
    nodeData,
    dataPath,
    syncWithNodeData = true,
  } = options;
  const [value, setValueState] = useState(() => {
    if (nodeData && dataPath && syncWithNodeData) {
      const nodeValue = getNestedValue(nodeData, dataPath);
      return nullishCoalesce(nodeValue, initialValue);
    }
    return initialValue;
  });
  const inputRef = useRef(null);
  useEffect(() => {
    if (!syncWithNodeData || !nodeData || !dataPath) {
      return;
    }
    if (document.activeElement === inputRef.current) {
      return;
    }
    const nodeValue = getNestedValue(nodeData, dataPath);
    if (nodeValue !== void 0 && nodeValue !== value) {
      setValueState(nodeValue);
    }
  }, [nodeData, dataPath, syncWithNodeData, value]);
  const setValue = useCallback(
    (newValue) => {
      const valueToSet =
        typeof newValue === "function" ? newValue(value) : newValue;
      setValueState(valueToSet);
      onUpdate(valueToSet);
    },
    [value, onUpdate],
  );
  return {
    value,
    setValue,
    inputRef,
  };
}
function useSimpleFormField(initialValue, onUpdate) {
  return useFormField({
    initialValue,
    onUpdate,
    syncWithNodeData: false,
  });
}
export { useFormField, useSimpleFormField };
