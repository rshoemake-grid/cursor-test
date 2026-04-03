import { TOOL_NODE } from "./marketplaceConstants";
function isNonEmptyString(value) {
  return value != null && value !== "";
}
function getToolLabel(tool) {
  if (isNonEmptyString(tool.name)) return tool.name;
  if (isNonEmptyString(tool.label)) return tool.label;
  return TOOL_NODE.DEFAULT_LABEL;
}
function getToolDescription(tool) {
  return isNonEmptyString(tool.description) ? tool.description : "";
}
function getToolConfig(tool) {
  if (tool.tool_config && typeof tool.tool_config.tool_name === "string") {
    return tool.tool_config;
  }
  return { tool_name: "calculator" };
}
function convertToolToNode(tool, position, index) {
  const nodeId = `tool-${Date.now()}-${index}`;
  return {
    id: nodeId,
    type: TOOL_NODE.TYPE,
    position,
    draggable: true,
    data: {
      label: getToolLabel(tool),
      name: getToolLabel(tool),
      description: getToolDescription(tool),
      tool_config: getToolConfig(tool),
      inputs: [],
    },
  };
}
function convertToolsToNodes(tools, positions) {
  return tools.map((tool, index) =>
    convertToolToNode(tool, positions[index], index),
  );
}
export { convertToolToNode, convertToolsToNodes };
