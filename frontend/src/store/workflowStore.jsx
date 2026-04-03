import { store } from "../redux/store";
import {
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
  selectWorkflowDefinition,
} from "../redux/workflow/workflowSlice";

function bindWorkflowCommands(dispatch) {
  return {
    setWorkflowId: (id) => dispatch(setWorkflowId(id)),
    setWorkflowName: (name) => dispatch(setWorkflowName(name)),
    setWorkflowDescription: (description) =>
      dispatch(setWorkflowDescription(description)),
    setNodes: (nodes) => dispatch(setNodes(nodes)),
    setEdges: (edges) => dispatch(setEdges(edges)),
    setVariables: (variables) => dispatch(setVariables(variables)),
    addNode: (node) => dispatch(addNode(node)),
    updateNode: (nodeId, data) => dispatch(updateNode({ nodeId, data })),
    removeNode: (nodeId) => dispatch(removeNode(nodeId)),
    addEdge: (edge) => dispatch(addEdge(edge)),
    removeEdge: (edgeId) => dispatch(removeEdge(edgeId)),
    loadWorkflow: (workflow) => dispatch(loadWorkflow(workflow)),
    clearWorkflow: () => dispatch(clearWorkflow()),
    toWorkflowDefinition: () => selectWorkflowDefinition(store.getState()),
  };
}

const useWorkflowStore = {
  getState() {
    const slice = store.getState().workflow;
    return {
      ...slice,
      ...bindWorkflowCommands(store.dispatch),
    };
  },
  setState(partial) {
    store.dispatch(replaceWorkflowState(partial));
  },
};

export { useWorkflowStore };
