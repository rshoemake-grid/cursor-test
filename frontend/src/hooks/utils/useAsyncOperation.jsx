import { useState, useCallback } from "react";
import { logger } from "../../utils/logger";
function useAsyncOperation({
  operation,
  onSuccess,
  onError,
  logger: injectedLogger = logger
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Operation timeout")), 3e4);
        });
        const result = await Promise.race([
          operation(...args),
          timeoutPromise
        ]);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const error2 = err instanceof Error ? err : new Error(String(err));
        setError(error2);
        injectedLogger.error("Async operation failed:", error2);
        onError?.(error2);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [operation, onSuccess, onError, injectedLogger]
  );
  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);
  return {
    execute,
    loading,
    error,
    reset
  };
}
export {
  useAsyncOperation
};
