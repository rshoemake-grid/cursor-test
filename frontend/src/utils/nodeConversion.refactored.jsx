import { coalesceArray } from "./nullCoalescing";
function isValidNonEmptyString(value) {
  return typeof value === "string" && value !== null && value !== void 0 && value !== "";
}
function extractValidString(value) {
  return isValidNonEmptyString(value) ? value : null;
}
function extractNodeName(nodeData) {
  const nameValue = extractValidString(nodeData.name);
  const labelValue = extractValidString(nodeData.label);
  return nameValue ?? labelValue;
}
function convertSingleNode(node) {
  const name = extractNodeName(node.data) ?? "";
  const inputs = coalesceArray(node.data.inputs, []);
  return {
    id: node.id,
    type: node.type,
    // NodeType from workflow types
    name,
    description: node.data.description,
    agent_config: node.data.agent_config,
    condition_config: node.data.condition_config,
    loop_config: node.data.loop_config,
    input_config: node.data.input_config,
    inputs,
    position: node.position
  };
}
function convertNodesForExecutionInput(nodes) {
  return nodes.map(convertSingleNode);
}
export {
  convertNodesForExecutionInput
};
