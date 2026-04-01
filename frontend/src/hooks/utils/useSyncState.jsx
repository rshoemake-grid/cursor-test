import { useEffect, useRef } from "react";
function useSyncState(source, setter, condition) {
  const setterRef = useRef(setter);
  const conditionRef = useRef(condition);
  setterRef.current = setter;
  conditionRef.current = condition;
  useEffect(() => {
    if (conditionRef.current !== void 0) {
      if (conditionRef.current(source)) {
        setterRef.current(source);
      }
    } else {
      if (source) {
        setterRef.current(source);
      }
    }
  }, [source]);
}
function useSyncStateWithDefault(source, setter, defaultValue = null) {
  const setterRef = useRef(setter);
  const defaultValueRef = useRef(defaultValue);
  setterRef.current = setter;
  defaultValueRef.current = defaultValue;
  useEffect(() => {
    if (source === null || source === void 0) {
      setterRef.current(defaultValueRef.current);
    } else {
      setterRef.current(source);
    }
  }, [source]);
}
export {
  useSyncState,
  useSyncStateWithDefault
};
