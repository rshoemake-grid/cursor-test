import { useState, useEffect } from "react";
function useInputFieldSync(ref, configValue, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    if (document.activeElement !== ref.current) {
      if (configValue !== null && configValue !== void 0) {
        if (typeof configValue === "string" && configValue === "") {
          setValue(defaultValue);
        } else {
          setValue(configValue);
        }
      } else {
        setValue(defaultValue);
      }
    }
  }, [configValue, defaultValue, ref]);
  return [value, setValue];
}
function useInputFieldSyncSimple(configValue, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    if (configValue !== null && configValue !== void 0) {
      if (typeof configValue === "string" && configValue === "") {
        setValue(defaultValue);
      } else {
        setValue(configValue);
      }
    } else {
      setValue(defaultValue);
    }
  }, [configValue, defaultValue]);
  return [value, setValue];
}
export { useInputFieldSync, useInputFieldSyncSimple };
