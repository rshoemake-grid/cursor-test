export const selectWorkflowState = (state) => state.workflow

export const selectWorkflowToDefinition = (state) => {
  const s = state.workflow
  const nodeToWorkflowNode = (node) => {
    const nodeData = node.data || {}
    return {
      id: node.id,
      type: node.type,
      name: nodeData.label || nodeData.name || node.id,
      description: nodeData.description,
      agent_config: nodeData.agent_config,
      condition_config: nodeData.condition_config
        ? {
            condition_type: nodeData.condition_config.condition_type || 'equals',
            field: nodeData.condition_config.field || '',
            value: nodeData.condition_config.value || '',
            true_branch: nodeData.condition_config.true_branch,
            false_branch: nodeData.condition_config.false_branch,
          }
        : undefined,
      loop_config: nodeData.loop_config
        ? {
            loop_type: nodeData.loop_config.loop_type || 'for_each',
            items_source: nodeData.loop_config.items_source,
            condition: nodeData.loop_config.condition,
            max_iterations: nodeData.loop_config.max_iterations ?? undefined,
          }
        : undefined,
      inputs: (nodeData.inputs || []).map((input) => {
        if (typeof input === 'string') {
          return { name: input, source_node: undefined, source_field: '' }
        }
        return {
          name: input.name,
          source_node: input.source_node,
          source_field: input.source_field || '',
        }
      }),
      position: node.position,
    }
  }

  return {
    name: s.workflowName,
    description: s.workflowDescription,
    nodes: s.nodes.map(nodeToWorkflowNode),
    edges: s.edges,
    variables: s.variables,
  }
}
