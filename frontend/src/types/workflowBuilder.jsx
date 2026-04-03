function hasWorkflowBuilderCoreProps(obj) {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.tabId === "string" &&
    (typeof obj.workflowId === "string" || obj.workflowId === null) &&
    typeof obj.tabName === "string" &&
    typeof obj.tabIsUnsaved === "boolean"
  );
}
function hasWorkflowBuilderExecutionProps(obj) {
  return typeof obj === "object" && obj !== null;
}
function hasWorkflowBuilderPersistenceProps(obj) {
  return typeof obj === "object" && obj !== null;
}
function hasWorkflowBuilderDependencyProps(obj) {
  return typeof obj === "object" && obj !== null;
}
function isValidWorkflowBuilderProps(obj) {
  return hasWorkflowBuilderCoreProps(obj);
}
export {
  hasWorkflowBuilderCoreProps,
  hasWorkflowBuilderDependencyProps,
  hasWorkflowBuilderExecutionProps,
  hasWorkflowBuilderPersistenceProps,
  isValidWorkflowBuilderProps,
};
