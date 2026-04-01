import { AGENT_NODE } from "./marketplaceConstants";
import { EMPTY_STRING } from "./inputDefaults";
function isNonEmptyString(value) {
  if (value === null || value === void 0) {
    return false;
  }
  if (value === "") {
    return false;
  }
  return true;
}
function getAgentNameOrLabel(agent) {
  if (isNonEmptyString(agent.name)) {
    return agent.name;
  }
  if (isNonEmptyString(agent.label)) {
    return agent.label;
  }
  return AGENT_NODE.DEFAULT_LABEL;
}
function getAgentLabel(agent) {
  return getAgentNameOrLabel(agent);
}
function getAgentName(agent) {
  return getAgentNameOrLabel(agent);
}
function getAgentDescription(agent) {
  if (isNonEmptyString(agent.description)) {
    return agent.description;
  }
  return EMPTY_STRING;
}
function getAgentConfig(agent) {
  if (agent.agent_config !== null && agent.agent_config !== void 0) {
    return agent.agent_config;
  }
  return {};
}
function convertAgentToNode(agent, position, index) {
  const nodeId = `agent-${Date.now()}-${index}`;
  return {
    id: nodeId,
    type: AGENT_NODE.TYPE,
    position,
    draggable: true,
    data: {
      label: getAgentLabel(agent),
      name: getAgentName(agent),
      description: getAgentDescription(agent),
      agent_config: getAgentConfig(agent)
    }
  };
}
function convertAgentsToNodes(agents, positions) {
  return agents.map((agent, index) => {
    return convertAgentToNode(agent, positions[index], index);
  });
}
export {
  convertAgentToNode,
  convertAgentsToNodes,
  getAgentConfig,
  getAgentDescription,
  getAgentLabel,
  getAgentName
};
