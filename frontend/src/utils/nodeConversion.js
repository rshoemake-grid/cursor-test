/**
 * Node Conversion Utilities
 * Converts React Flow nodes to various formats for different use cases
 * Refactored to use nullCoalescing utilities (DRY + SOLID principles)
 */ import { coalesceStringChain, coalesceArray } from './nullCoalescing';
import { isNonEmptyString } from './validationHelpers';
/**
 * Convert React Flow nodes to WorkflowNode format for ExecutionInputDialog
 */ export function convertNodesForExecutionInput(nodes) {
    return nodes.map((node)=>{
        // Use validation helper to extract valid strings (DRY - eliminates duplication)
        // Type assertion needed as node.data is typed as Record<string, unknown>
        const nodeData = node.data;
        const nameValue = isNonEmptyString(nodeData.name) ? nodeData.name : null;
        const labelValue = isNonEmptyString(nodeData.label) ? nodeData.label : null;
        // Use coalesceStringChain to kill ConditionalExpression mutations
        const name = coalesceStringChain('', nameValue, labelValue);
        // Use coalesceArray to kill ConditionalExpression mutations
        const inputs = coalesceArray(nodeData.inputs, []);
        return {
            id: node.id,
            type: node.type,
            name,
            description: nodeData.description,
            // Type conversion needed due to slight differences between NodeData and WorkflowNode types
            agent_config: nodeData.agent_config,
            condition_config: nodeData.condition_config,
            loop_config: nodeData.loop_config,
            input_config: nodeData.input_config,
            inputs,
            position: node.position
        };
    });
}
