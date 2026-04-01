import { useEffect, useRef } from "react";
function useDebounce(value, delay, callback) {
  const timeoutRef = useRef(null);
  useEffect(() => {
    if (timeoutRef.current !== null && timeoutRef.current !== void 0) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(value);
    }, delay);
    return () => {
      if (timeoutRef.current !== null && timeoutRef.current !== void 0) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, callback]);
}
export {
  useDebounce
};
