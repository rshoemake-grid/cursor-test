export function selectWorkflow(state) {
  return state.workflow;
}

export function selectWorkflowId(state) {
  return state.workflow.workflowId;
}

export function selectWorkflowNodes(state) {
  return state.workflow.nodes;
}

export function selectWorkflowEdges(state) {
  return state.workflow.edges;
}
