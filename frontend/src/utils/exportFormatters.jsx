function exportToJSON(executions) {
  return JSON.stringify(executions, null, 2);
}
function exportToCSV(executions) {
  if (executions.length === 0) {
    return "";
  }
  const headers = [
    "Execution ID",
    "Workflow ID",
    "Status",
    "Started At",
    "Completed At",
    "Duration (seconds)",
    "Current Node",
    "Error",
  ];
  const rows = executions.map((execution) => {
    const duration = execution.completed_at
      ? Math.floor(
          (new Date(execution.completed_at).getTime() -
            new Date(execution.started_at).getTime()) /
            1e3,
        )
      : Math.floor(
          (Date.now() - new Date(execution.started_at).getTime()) / 1e3,
        );
    return [
      execution.execution_id,
      execution.workflow_id,
      execution.status,
      execution.started_at,
      execution.completed_at || "",
      duration.toString(),
      execution.current_node || "",
      execution.error || "",
    ];
  });
  const csvRows = [headers, ...rows].map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
  );
  return csvRows.join("\n");
}
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
function exportExecutionsToJSON(executions, filename) {
  const json = exportToJSON(executions);
  const defaultFilename = `executions-${/* @__PURE__ */ new Date().toISOString().split("T")[0]}.json`;
  downloadFile(json, filename || defaultFilename, "application/json");
}
function exportExecutionsToCSV(executions, filename) {
  const csv = exportToCSV(executions);
  const defaultFilename = `executions-${/* @__PURE__ */ new Date().toISOString().split("T")[0]}.csv`;
  downloadFile(csv, filename || defaultFilename, "text/csv");
}
export {
  downloadFile,
  exportExecutionsToCSV,
  exportExecutionsToJSON,
  exportToCSV,
  exportToJSON,
};
