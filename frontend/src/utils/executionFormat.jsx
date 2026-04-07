import { Clock, CheckCircle, XCircle, Play, AlertCircle } from "lucide-react";
import { ExecStatusIconWrap } from "../styles/executionConsole.styled";

function formatExecutionDuration(startedAt, completedAt) {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const duration = Math.floor((end - start) / 1e3);
  if (duration < 60) {
    return `${duration}s`;
  } else if (duration < 3600) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  } else {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}
function getExecutionStatusIcon(status) {
  switch (status) {
    case "completed":
      return (
        <ExecStatusIconWrap $status="completed">
          <CheckCircle aria-hidden />
        </ExecStatusIconWrap>
      );
    case "failed":
      return (
        <ExecStatusIconWrap $status="failed">
          <XCircle aria-hidden />
        </ExecStatusIconWrap>
      );
    case "running":
      return (
        <ExecStatusIconWrap $status="running" $pulse>
          <Play aria-hidden />
        </ExecStatusIconWrap>
      );
    case "pending":
      return (
        <ExecStatusIconWrap $status="pending">
          <Clock aria-hidden />
        </ExecStatusIconWrap>
      );
    default:
      return (
        <ExecStatusIconWrap $status="default">
          <AlertCircle aria-hidden />
        </ExecStatusIconWrap>
      );
  }
}
function sortExecutionsByStartTime(executions) {
  return [...executions].sort((a, b) => {
    const aTime = new Date(a.started_at).getTime();
    const bTime = new Date(b.started_at).getTime();
    return bTime - aTime;
  });
}
function calculateExecutionProgress(nodeStates) {
  if (!nodeStates) {
    return 0;
  }
  const nodeEntries = Object.entries(nodeStates);
  const totalNodes = nodeEntries.length;
  if (totalNodes === 0) {
    return 0;
  }
  const completedNodes = nodeEntries.filter(([_, state]) => {
    return state?.status === "completed";
  }).length;
  return Math.min(Math.floor((completedNodes / totalNodes) * 100), 100);
}
export {
  calculateExecutionProgress,
  formatExecutionDuration,
  getExecutionStatusIcon,
  sortExecutionsByStartTime,
};
