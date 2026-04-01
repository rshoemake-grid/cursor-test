import { coalesceObject, coalesceArray, coalesceObjectChain, coalesceArrayChain, coalesceStringChain } from "./nullCoalescing";
import { safeGetProperty } from "./safeAccess";
import { isDefined } from "./typeGuards";
const CONFIG_TYPES = ["agent_config", "condition_config", "loop_config", "input_config", "tool_config"];
function mergeConfigs(data, wfNode) {
  const configs = {};
  for (const configType of CONFIG_TYPES) {
    const dataConfig = safeGetProperty(data, configType, void 0);
    const wfNodeConfig = safeGetProperty(wfNode, configType, void 0);
    configs[configType] = coalesceObjectChain({}, dataConfig, wfNodeConfig);
  }
  return configs;
}
function extractHandle(edge, handleType) {
  const camelKey = `${handleType}Handle`;
  const snakeKey = `${handleType}_handle`;
  const camelValue = edge[camelKey];
  const isCamelDefined = isDefined(camelValue) === true;
  const isCamelNotFalse = camelValue !== false;
  if (isCamelDefined === true && isCamelNotFalse === true) {
    return normalizeHandle(camelValue);
  }
  const snakeValue = edge[snakeKey];
  const isSnakeDefined = isDefined(snakeValue) === true;
  const isSnakeNotFalse = snakeValue !== false;
  if (isSnakeDefined === true && isSnakeNotFalse === true) {
    return normalizeHandle(snakeValue);
  }
  return null;
}
function normalizeHandle(handle) {
  if (handle === true) return "true";
  const isString = typeof handle === "string";
  const isNonEmptyString = isString === true && handle !== "";
  if (isNonEmptyString === true) return handle;
  const isNumber = typeof handle === "number";
  if (isNumber === true) return String(handle);
  return null;
}
function generateEdgeId(edge, sourceHandle) {
  const hasId = isDefined(edge.id) === true && edge.id !== "";
  if (hasId === true) {
    return edge.id;
  }
  const hasSourceHandle = isDefined(sourceHandle) === true && sourceHandle !== "";
  if (hasSourceHandle === true) {
    return `${edge.source}-${sourceHandle}-${edge.target}`;
  }
  return `${edge.source}-${edge.target}`;
}
function convertEdgesToWorkflowFormat(edges) {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: typeof edge.label === "string" ? edge.label : void 0
  }));
}
function convertNodesToWorkflowFormat(nodes) {
  return nodes.map((node) => {
    const nodeName = coalesceStringChain(
      node.id,
      // default fallback
      typeof node.data.name === "string" && node.data.name !== "" ? node.data.name : null,
      typeof node.data.label === "string" && node.data.label !== "" ? node.data.label : null
    );
    return {
      id: node.id,
      type: node.type,
      name: nodeName,
      description: typeof node.data.description === "string" ? node.data.description : void 0,
      agent_config: node.data.agent_config,
      condition_config: node.data.condition_config,
      loop_config: node.data.loop_config,
      input_config: node.data.input_config,
      tool_config: node.data.tool_config,
      inputs: coalesceArray(node.data.inputs, []),
      position: node.position
    };
  });
}
function createWorkflowDefinition(params) {
  return {
    name: params.name,
    description: params.description,
    nodes: convertNodesToWorkflowFormat(params.nodes),
    edges: convertEdgesToWorkflowFormat(params.edges),
    variables: params.variables
  };
}
function initializeReactFlowNodes(nodes) {
  return nodes.map((node) => ({
    ...node,
    draggable: true,
    selected: false,
    data: {
      ...node.data,
      // Use mergeConfigs to eliminate DRY violation
      ...mergeConfigs(node.data, {}),
      inputs: coalesceArray(node.data.inputs, [])
    }
  }));
}
function formatEdgesForReactFlow(edges) {
  return edges.map((edge) => {
    const sourceHandle = extractHandle(edge, "source");
    const targetHandle = extractHandle(edge, "target");
    const edgeId = generateEdgeId(edge, sourceHandle);
    const formattedEdge = {
      id: edgeId,
      source: edge.source,
      target: edge.target
    };
    const hasSourceHandle = isDefined(sourceHandle) === true && sourceHandle !== "";
    if (hasSourceHandle === true) {
      formattedEdge.sourceHandle = String(sourceHandle);
    }
    const hasTargetHandle = isDefined(targetHandle) === true && targetHandle !== "";
    if (hasTargetHandle === true) {
      formattedEdge.targetHandle = String(targetHandle);
    }
    Object.keys(edge).forEach((key) => {
      if (key !== "sourceHandle" && key !== "source_handle" && key !== "targetHandle" && key !== "target_handle") {
        formattedEdge[key] = edge[key];
      }
    });
    return formattedEdge;
  });
}
function normalizeNodeForStorage(node) {
  return {
    ...node,
    data: {
      ...node.data,
      // Use mergeConfigs to eliminate DRY violation
      ...mergeConfigs(
        node.data,
        node
      )
    }
  };
}
function workflowNodeToReactFlowNode(wfNode, nodeExecutionStates) {
  const data = coalesceObject(wfNode.data, {});
  const nodeExecutionState = safeGetProperty(nodeExecutionStates, wfNode.id, void 0);
  return {
    id: wfNode.id,
    type: wfNode.type,
    position: coalesceObject(wfNode.position, { x: 0, y: 0 }),
    draggable: true,
    selected: false,
    data: {
      label: coalesceStringChain(
        wfNode.type,
        // final fallback
        data.label,
        data.name,
        wfNode.name
      ),
      name: coalesceStringChain(
        wfNode.type,
        // final fallback
        data.name,
        wfNode.name
      ),
      description: coalesceStringChain(
        "",
        // default
        data.description,
        wfNode.description
      ),
      // Merge configs - prefer data object, fallback to top-level
      // Use mergeConfigs to eliminate DRY violation
      ...mergeConfigs(data, wfNode),
      inputs: coalesceArrayChain([], data.inputs, wfNode.inputs),
      // Add execution state for visual feedback
      // Use safeGetProperty to kill OptionalChaining mutations
      executionStatus: safeGetProperty(nodeExecutionState, "status", void 0),
      executionError: safeGetProperty(nodeExecutionState, "error", void 0)
    }
  };
}
export {
  convertEdgesToWorkflowFormat,
  convertNodesToWorkflowFormat,
  createWorkflowDefinition,
  formatEdgesForReactFlow,
  initializeReactFlowNodes,
  normalizeNodeForStorage,
  workflowNodeToReactFlowNode
};
