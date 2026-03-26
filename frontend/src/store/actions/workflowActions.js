/** Action types and creators for workflow editor state (replaces Zustand workflow store). */

export const WORKFLOW_SET_ID = 'workflow/SET_ID'
export const WORKFLOW_SET_NAME = 'workflow/SET_NAME'
export const WORKFLOW_SET_DESCRIPTION = 'workflow/SET_DESCRIPTION'
export const WORKFLOW_SET_NODES = 'workflow/SET_NODES'
export const WORKFLOW_SET_EDGES = 'workflow/SET_EDGES'
export const WORKFLOW_SET_VARIABLES = 'workflow/SET_VARIABLES'
export const WORKFLOW_ADD_NODE = 'workflow/ADD_NODE'
export const WORKFLOW_UPDATE_NODE = 'workflow/UPDATE_NODE'
export const WORKFLOW_REMOVE_NODE = 'workflow/REMOVE_NODE'
export const WORKFLOW_ADD_EDGE = 'workflow/ADD_EDGE'
export const WORKFLOW_REMOVE_EDGE = 'workflow/REMOVE_EDGE'
export const WORKFLOW_LOAD = 'workflow/LOAD'
export const WORKFLOW_CLEAR = 'workflow/CLEAR'

export const workflowActions = {
  setWorkflowId: (id) => ({ type: WORKFLOW_SET_ID, payload: id }),
  setWorkflowName: (name) => ({ type: WORKFLOW_SET_NAME, payload: name }),
  setWorkflowDescription: (description) => ({
    type: WORKFLOW_SET_DESCRIPTION,
    payload: description,
  }),
  setNodes: (nodes) => ({ type: WORKFLOW_SET_NODES, payload: nodes }),
  setEdges: (edges) => ({ type: WORKFLOW_SET_EDGES, payload: edges }),
  setVariables: (variables) => ({ type: WORKFLOW_SET_VARIABLES, payload: variables }),
  addNode: (node) => ({ type: WORKFLOW_ADD_NODE, payload: node }),
  updateNode: (nodeId, data) => ({
    type: WORKFLOW_UPDATE_NODE,
    payload: { nodeId, data },
  }),
  removeNode: (nodeId) => ({ type: WORKFLOW_REMOVE_NODE, payload: nodeId }),
  addEdge: (edge) => ({ type: WORKFLOW_ADD_EDGE, payload: edge }),
  removeEdge: (edgeId) => ({ type: WORKFLOW_REMOVE_EDGE, payload: edgeId }),
  loadWorkflow: (workflow) => ({ type: WORKFLOW_LOAD, payload: workflow }),
  clearWorkflow: () => ({ type: WORKFLOW_CLEAR }),
}
