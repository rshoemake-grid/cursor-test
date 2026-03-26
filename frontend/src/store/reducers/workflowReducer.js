import {
  WORKFLOW_SET_ID,
  WORKFLOW_SET_NAME,
  WORKFLOW_SET_DESCRIPTION,
  WORKFLOW_SET_NODES,
  WORKFLOW_SET_EDGES,
  WORKFLOW_SET_VARIABLES,
  WORKFLOW_ADD_NODE,
  WORKFLOW_UPDATE_NODE,
  WORKFLOW_REMOVE_NODE,
  WORKFLOW_ADD_EDGE,
  WORKFLOW_REMOVE_EDGE,
  WORKFLOW_LOAD,
  WORKFLOW_CLEAR,
} from '../actions/workflowActions'

function workflowNodeToNode(wfNode) {
  const nodeData = wfNode.data || {}
  return {
    id: wfNode.id,
    type: wfNode.type,
    position: wfNode.position || { x: 0, y: 0 },
    data: {
      label: nodeData.label || nodeData.name || wfNode.name || wfNode.type,
      name: nodeData.name || wfNode.name || wfNode.type,
      description: nodeData.description || wfNode.description,
      agent_config: nodeData.agent_config || wfNode.agent_config,
      condition_config: nodeData.condition_config || wfNode.condition_config,
      loop_config: nodeData.loop_config || wfNode.loop_config,
      inputs: nodeData.inputs || wfNode.inputs || [],
    },
  }
}

const initialState = {
  workflowId: null,
  workflowName: 'Untitled Workflow',
  workflowDescription: '',
  nodes: [],
  edges: [],
  variables: {},
}

export default function workflowReducer(state = initialState, action) {
  switch (action.type) {
    case WORKFLOW_SET_ID:
      return { ...state, workflowId: action.payload }
    case WORKFLOW_SET_NAME:
      return { ...state, workflowName: action.payload }
    case WORKFLOW_SET_DESCRIPTION:
      return { ...state, workflowDescription: action.payload }
    case WORKFLOW_SET_NODES:
      return { ...state, nodes: action.payload }
    case WORKFLOW_SET_EDGES:
      return { ...state, edges: action.payload }
    case WORKFLOW_SET_VARIABLES:
      return { ...state, variables: action.payload }
    case WORKFLOW_ADD_NODE:
      return { ...state, nodes: [...state.nodes, action.payload] }
    case WORKFLOW_UPDATE_NODE: {
      const { nodeId, data } = action.payload
      return {
        ...state,
        nodes: state.nodes.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
        ),
      }
    }
    case WORKFLOW_REMOVE_NODE: {
      const nodeId = action.payload
      return {
        ...state,
        nodes: state.nodes.filter((node) => node.id !== nodeId),
        edges: state.edges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        ),
      }
    }
    case WORKFLOW_ADD_EDGE:
      return { ...state, edges: [...state.edges, action.payload] }
    case WORKFLOW_REMOVE_EDGE: {
      const edgeId = action.payload
      return {
        ...state,
        edges: state.edges.filter((edge) => edge.id !== edgeId),
      }
    }
    case WORKFLOW_LOAD: {
      const workflow = action.payload
      const nodes = workflow.nodes.map(workflowNodeToNode)
      const edges = workflow.edges
      return {
        ...state,
        workflowId: workflow.id || null,
        workflowName: workflow.name,
        workflowDescription: workflow.description || '',
        nodes,
        edges,
        variables: workflow.variables,
      }
    }
    case WORKFLOW_CLEAR:
      return { ...initialState }
    default:
      return state
  }
}
