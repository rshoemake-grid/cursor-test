import { coalesceStringChain, coalesceArray } from "./nullCoalescing";
import { isNonEmptyString } from "./validationHelpers";
function convertNodesForExecutionInput(nodes) {
  return nodes.map((node) => {
    const nodeData = node.data;
    const nameValue = isNonEmptyString(nodeData.name) ? nodeData.name : null;
    const labelValue = isNonEmptyString(nodeData.label) ? nodeData.label : null;
    const name = coalesceStringChain("", nameValue, labelValue);
    const inputs = coalesceArray(nodeData.inputs, []);
    return {
      id: node.id,
      type: node.type,
      // NodeType from workflow types
      name,
      description: nodeData.description,
      // Type conversion needed due to slight differences between NodeData and WorkflowNode types
      agent_config: nodeData.agent_config,
      condition_config: nodeData.condition_config,
      loop_config: nodeData.loop_config,
      input_config: nodeData.input_config,
      inputs,
      position: node.position,
    };
  });
}
export { convertNodesForExecutionInput };
