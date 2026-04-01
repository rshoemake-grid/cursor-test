import { useState, useCallback } from "react";
function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback(
    (message, type = "info", duration) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast = {
        id,
        message,
        type,
        duration
      };
      setToasts((prev) => [...prev, newToast]);
      return id;
    },
    []
  );
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  const success = useCallback(
    (message, duration) => addToast(message, "success", duration),
    [addToast]
  );
  const error = useCallback(
    (message, duration) => addToast(message, "error", duration),
    [addToast]
  );
  const warning = useCallback(
    (message, duration) => addToast(message, "warning", duration),
    [addToast]
  );
  const info = useCallback(
    (message, duration) => addToast(message, "info", duration),
    [addToast]
  );
  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
}
export {
  useToast
};
