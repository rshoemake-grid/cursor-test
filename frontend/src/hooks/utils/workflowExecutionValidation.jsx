function isUserAuthenticated(isAuthenticated) {
  return isAuthenticated === true;
}
function hasWorkflowId(workflowId) {
  return workflowId != null && workflowId !== "";
}
function isConfirmed(confirmed) {
  return confirmed === true;
}
function isWorkflowSaved(savedId) {
  return savedId != null && savedId !== "";
}
function canExecuteWorkflow(workflowId) {
  return workflowId != null && workflowId !== "";
}
export {
  canExecuteWorkflow,
  hasWorkflowId,
  isConfirmed,
  isUserAuthenticated,
  isWorkflowSaved
};
