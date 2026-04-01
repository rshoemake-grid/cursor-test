import { useEffect, useRef, useMemo } from "react";
import { logger } from "../../utils/logger";
import { hasValueChanged } from "../utils/useValueComparison";
import { useFirstRender } from "../utils/useFirstRender";
import { useDebounce } from "../utils/useDebounce";
function useAutoSave(value, saveFn, delay = 500, enabled = true) {
  const previousValueRef = useRef(value);
  const { isFirstRender, markAsRendered } = useFirstRender();
  const debouncedSaveFn = useMemo(() => {
    return (val) => {
      try {
        saveFn(val);
      } catch (error) {
        logger.error("Auto-save failed:", error);
      }
    };
  }, [saveFn]);
  const valueToDebounceRef = useRef(null);
  const shouldSaveRef = useRef(false);
  useEffect(() => {
    if (enabled !== true) {
      valueToDebounceRef.current = null;
      shouldSaveRef.current = false;
      return;
    }
    if (isFirstRender) {
      previousValueRef.current = value;
      markAsRendered();
      valueToDebounceRef.current = null;
      shouldSaveRef.current = false;
      return;
    }
    const hasChanged = hasValueChanged(value, previousValueRef.current);
    if (hasChanged) {
      previousValueRef.current = value;
      valueToDebounceRef.current = value;
      shouldSaveRef.current = true;
    } else {
      valueToDebounceRef.current = null;
      shouldSaveRef.current = false;
    }
  }, [value, enabled, isFirstRender, markAsRendered]);
  useDebounce(value, delay, () => {
    if (shouldSaveRef.current && enabled && !isFirstRender && valueToDebounceRef.current !== null) {
      debouncedSaveFn(valueToDebounceRef.current);
      shouldSaveRef.current = false;
      valueToDebounceRef.current = null;
    }
  });
}
export {
  useAutoSave
};
