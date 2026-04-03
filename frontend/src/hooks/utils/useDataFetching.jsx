import { useState, useCallback } from "react";
import { logger } from "../../utils/logger";
import { nullishCoalesce } from "./nullishCoalescing";
import { isRunningUnderStryker } from "../../test/utils/detectStryker";
function useDataFetching({
  fetchFn,
  initialData,
  onError,
  logger: injectedLogger = logger,
}) {
  const [data, setData] = useState(nullishCoalesce(initialData, null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const timeoutMs = isRunningUnderStryker() ? 12e4 : 3e4;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Fetch timeout")), timeoutMs);
      });
      const result = await Promise.race([fetchFn(), timeoutPromise]);
      setData(result);
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error(String(err));
      setError(error2);
      injectedLogger.error("Data fetch failed:", error2);
      onError?.(error2);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, onError, injectedLogger]);
  return {
    data,
    loading,
    error,
    refetch,
  };
}
export { useDataFetching };
