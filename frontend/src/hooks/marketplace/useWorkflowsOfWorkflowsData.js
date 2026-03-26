/**
 * Workflows of Workflows Data Hook
 * Single Responsibility: Only fetches and manages workflows of workflows data
 */ import { useCallback } from 'react';
import { logger } from '../../utils/logger';
import { buildSearchParams } from './useMarketplaceData.utils';
import { logicalOr, logicalOrToEmptyObject } from '../utils/logicalOr';
/**
 * Hook for fetching workflows of workflows data
 * Single Responsibility: Only handles workflows of workflows fetching
 */ export function useWorkflowsOfWorkflowsData({ httpClient, apiBaseUrl, category, searchQuery, sortBy }) {
    const fetchWorkflowsOfWorkflows = useCallback(async ()=>{
        // Fetch all workflows
        const params = buildSearchParams(category, searchQuery, sortBy);
        const response = await httpClient.get(`${apiBaseUrl}/templates/?${params}`);
        const allWorkflows = await response.json();
        // Filter workflows that contain references to other workflows
        // A "workflow of workflows" is one that references other workflows in its definition
        const workflowsOfWorkflows = [];
        for (const workflow of allWorkflows){
            try {
                // Use the /use endpoint to get workflow details
                const workflowResponse = await httpClient.post(`${apiBaseUrl}/templates/${workflow.id}/use`, {}, {
                    'Content-Type': 'application/json'
                });
                if (workflowResponse.ok) {
                    const workflowDetail = await workflowResponse.json();
                    // Check if workflow has nodes that reference other workflows
                    if (workflowDetail.nodes && Array.isArray(workflowDetail.nodes)) {
                        const hasWorkflowReference = workflowDetail.nodes.some((node)=>{
                            const nodeData = logicalOrToEmptyObject(node.data);
                            const hasWorkflowId = logicalOr(node.workflow_id, nodeData.workflow_id);
                            const description = logicalOr(node.description, logicalOr(nodeData.description, '')).toLowerCase();
                            const name = logicalOr(node.name, logicalOr(nodeData.name, '')).toLowerCase();
                            return hasWorkflowId || description.includes('workflow') || name.includes('workflow') || workflow.tags && workflow.tags.some((tag)=>tag.toLowerCase().includes('workflow'));
                        });
                        // Also check if workflow description or tags indicate it's a workflow of workflows
                        const descResult = logicalOr(workflow.description, '');
                        const workflowDescription = descResult !== null && descResult !== undefined ? descResult : '';
                        const descLower = workflowDescription.toLowerCase();
                        const isWorkflowOfWorkflows = descLower.includes('workflow of workflows') || descLower.includes('composite workflow') || workflowDescription.includes('nested workflow') || workflow.tags && workflow.tags.some((tag)=>tag.toLowerCase().includes('workflow-of-workflows') || tag.toLowerCase().includes('composite') || tag.toLowerCase().includes('nested'));
                        if (hasWorkflowReference || isWorkflowOfWorkflows) {
                            workflowsOfWorkflows.push(workflow);
                        }
                    }
                }
            } catch (error) {
                logger.error(`Failed to check workflow ${workflow.id}:`, error);
            }
        }
        return workflowsOfWorkflows;
    }, [
        httpClient,
        apiBaseUrl,
        category,
        searchQuery,
        sortBy
    ]);
    return {
        fetchWorkflowsOfWorkflows
    };
}
