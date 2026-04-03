import { useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchExecutionsRequested } from "../../redux/executions/executionsActions";
import {
  selectExecutionsItems,
  selectExecutionsStatus,
  selectExecutionsError,
} from "../../redux/executions/executionsSelectors";
import { logger } from "../../utils/logger";

function useExecutionListQuery({
  apiClient,
  filters,
  enabled = true,
  refetchInterval = 5e3,
} = {}) {
  const dispatch = useDispatch();
  const items = useSelector(selectExecutionsItems);
  const status = useSelector(selectExecutionsStatus);
  const errorMessage = useSelector(selectExecutionsError);
  const filtersRef = useRef(filters);
  const apiClientRef = useRef(apiClient);
  filtersRef.current = filters;
  apiClientRef.current = apiClient;

  const isPending = status === "pending";
  const isError = status === "error";
  const isLoading = isPending && items.length === 0;
  const data =
    status === "idle" ? undefined : status === "error" ? undefined : items;

  const error =
    errorMessage != null && errorMessage !== ""
      ? errorMessage instanceof Error
        ? errorMessage
        : new Error(errorMessage)
      : null;

  const runFetch = useCallback(() => {
    const client = apiClientRef.current;
    const f = filtersRef.current;
    if (!client) {
      return;
    }
    dispatch(fetchExecutionsRequested({ apiClient: client, filters: f }));
  }, [dispatch]);

  const refetch = useCallback(() => {
    runFetch();
  }, [runFetch]);

  useEffect(() => {
    if (!enabled || !apiClient) {
      return undefined;
    }
    const tick = () => {
      try {
        runFetch();
      } catch (err) {
        logger.error("Failed to load executions:", err);
      }
    };
    tick();
    if (refetchInterval > 0) {
      const id = setInterval(tick, refetchInterval);
      return () => clearInterval(id);
    }
    return undefined;
  }, [enabled, apiClient, runFetch, refetchInterval, JSON.stringify(filters)]);

  return {
    data,
    isLoading,
    isPending,
    isError,
    error,
    refetch,
  };
}

export { useExecutionListQuery };
