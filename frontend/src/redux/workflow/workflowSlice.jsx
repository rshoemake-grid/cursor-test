import { createSlice } from "@reduxjs/toolkit";
import { nodeToWorkflowNode, workflowNodeToNode } from "./workflowModelUtils";

const initialState = {
  workflowId: null,
  workflowName: "Untitled Workflow",
  workflowDescription: "",
  nodes: [],
  edges: [],
  variables: {},
};

const workflowSlice = createSlice({
  name: "workflow",
  initialState,
  reducers: {
    setWorkflowId: (state, action) => {
      state.workflowId = action.payload;
    },
    setWorkflowName: (state, action) => {
      state.workflowName = action.payload;
    },
    setWorkflowDescription: (state, action) => {
      state.workflowDescription = action.payload;
    },
    setNodes: (state, action) => {
      state.nodes = action.payload;
    },
    setEdges: (state, action) => {
      state.edges = action.payload;
    },
    setVariables: (state, action) => {
      state.variables = action.payload;
    },
    addNode: (state, action) => {
      state.nodes = [...state.nodes, action.payload];
    },
    updateNode: (state, action) => {
      const { nodeId, data } = action.payload;
      state.nodes = state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node,
      );
    },
    removeNode: (state, action) => {
      const nodeId = action.payload;
      state.nodes = state.nodes.filter((node) => node.id !== nodeId);
      state.edges = state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      );
    },
    addEdge: (state, action) => {
      state.edges = [...state.edges, action.payload];
    },
    removeEdge: (state, action) => {
      const edgeId = action.payload;
      state.edges = state.edges.filter((edge) => edge.id !== edgeId);
    },
    loadWorkflow: (state, action) => {
      const workflow = action.payload;
      state.workflowId = workflow.id || null;
      state.workflowName = workflow.name;
      state.workflowDescription = workflow.description || "";
      state.nodes = workflow.nodes.map(workflowNodeToNode);
      state.edges = workflow.edges;
      state.variables = workflow.variables;
    },
    clearWorkflow: () => ({ ...initialState }),
    replaceWorkflowState: (state, action) => ({
      ...initialState,
      ...action.payload,
    }),
  },
});

const workflowReducer = workflowSlice.reducer;

export const {
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
} = workflowSlice.actions;

function selectWorkflowDefinition(state) {
  const s = state.workflow;
  return {
    name: s.workflowName,
    description: s.workflowDescription,
    nodes: s.nodes.map(nodeToWorkflowNode),
    edges: s.edges,
    variables: s.variables,
  };
}

export {
  workflowReducer,
  workflowSlice,
  initialState,
  selectWorkflowDefinition,
  nodeToWorkflowNode,
};
