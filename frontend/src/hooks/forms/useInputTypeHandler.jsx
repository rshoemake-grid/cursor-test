import { useCallback } from "react";
function useInputTypeHandler(type, onChange) {
  return useCallback((e) => {
    switch (type) {
      case "checkbox":
        onChange(e.target.checked);
        break;
      case "number":
        onChange(Number(e.target.value));
        break;
      default:
        onChange(e.target.value);
        break;
    }
  }, [type, onChange]);
}
export {
  useInputTypeHandler
};
