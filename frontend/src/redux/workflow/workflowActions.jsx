/**
 * Synchronous workflow editor actions (from workflowSlice).
 * Async workflow flows would use saga watchers started from workflowSagas.
 */
export {
  setWorkflowId,
  setWorkflowName,
  setWorkflowDescription,
  setNodes,
  setEdges,
  setVariables,
  addNode,
  updateNode,
  removeNode,
  addEdge,
  removeEdge,
  loadWorkflow,
  clearWorkflow,
  replaceWorkflowState,
} from "./workflowSlice";
