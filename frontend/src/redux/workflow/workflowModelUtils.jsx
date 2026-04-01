function nodeToWorkflowNode(node) {
  const nodeData = node.data;
  return {
    id: node.id,
    type: node.type,
    name: nodeData.label || nodeData.name || node.id,
    description: nodeData.description,
    agent_config: nodeData.agent_config,
    condition_config: nodeData.condition_config
      ? {
          condition_type: nodeData.condition_config.condition_type || "equals",
          field: nodeData.condition_config.field || "",
          value: nodeData.condition_config.value || "",
          true_branch: nodeData.condition_config.true_branch,
          false_branch: nodeData.condition_config.false_branch,
        }
      : void 0,
    loop_config: nodeData.loop_config
      ? {
          loop_type: nodeData.loop_config.loop_type || "for_each",
          items_source: nodeData.loop_config.items_source,
          condition: nodeData.loop_config.condition,
          max_iterations: nodeData.loop_config.max_iterations ?? void 0,
        }
      : void 0,
    inputs: (nodeData.inputs || []).map((input) => {
      if (typeof input === "string") {
        return {
          name: input,
          source_node: void 0,
          source_field: "",
        };
      }
      return {
        name: input.name,
        source_node: input.source_node,
        source_field: input.source_field || "",
      };
    }),
    position: node.position,
  };
}

function workflowNodeToNode(wfNode) {
  const nodeData = wfNode.data || {};
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
  };
}

export { nodeToWorkflowNode, workflowNodeToNode };
