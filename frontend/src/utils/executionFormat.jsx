import { Clock, CheckCircle, XCircle, Play, AlertCircle } from "lucide-react";
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
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "running":
      return <Play className="w-4 h-4 text-blue-500 animate-pulse" />;
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-500" />;
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
