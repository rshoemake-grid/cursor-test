import { useEffect, useRef } from "react";
function useExecutionNotifications({
  executions,
  onSuccess,
  onError,
  enabled = true,
}) {
  const previousStatusesRef = useRef(/* @__PURE__ */ new Map());
  useEffect(() => {
    if (!enabled) {
      return;
    }
    executions.forEach((execution) => {
      const executionId = execution.execution_id;
      const currentStatus = execution.status;
      const previousStatus = previousStatusesRef.current.get(executionId);
      if (previousStatus && previousStatus !== currentStatus) {
        if (currentStatus === "completed" && onSuccess) {
          onSuccess(execution);
        } else if (currentStatus === "failed" && onError) {
          onError(execution);
        }
      }
      previousStatusesRef.current.set(executionId, currentStatus);
    });
    const currentExecutionIds = new Set(executions.map((e) => e.execution_id));
    previousStatusesRef.current.forEach((_, executionId) => {
      if (!currentExecutionIds.has(executionId)) {
        previousStatusesRef.current.delete(executionId);
      }
    });
  }, [executions, enabled, onSuccess, onError]);
}
export { useExecutionNotifications };
