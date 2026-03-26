/**
 * API Endpoints Configuration
 * Centralized endpoint definitions to eliminate DRY violations
 * Single Responsibility: Only defines API endpoint URLs
 * DRY: Single source of truth for endpoint paths
 */ /**
 * Workflow endpoints
 */ export const workflowEndpoints = {
    list: ()=>'/workflows',
    detail: (id)=>`/workflows/${id}`,
    execute: (id)=>`/workflows/${id}/execute`,
    publish: (id)=>`/workflows/${id}/publish`,
    bulkDelete: ()=>'/workflows/bulk-delete'
};
/**
 * Execution endpoints
 */ export const executionEndpoints = {
    list: ()=>'/executions',
    detail: (id)=>`/executions/${id}`,
    logs: (id)=>`/executions/${id}/logs`,
    downloadLogs: (id)=>`/executions/${id}/logs/download`,
    cancel: (id)=>`/executions/${id}/cancel`
};
/**
 * Template endpoints
 */ export const templateEndpoints = {
    delete: (id)=>`/templates/${id}`
};
/**
 * Marketplace endpoints
 */ export const marketplaceEndpoints = {
    agents: ()=>'/marketplace/agents'
};
/**
 * Settings endpoints
 */ export const settingsEndpoints = {
    llm: ()=>'/settings/llm'
};
/**
 * Chat endpoints
 */ export const chatEndpoints = {
    chat: ()=>'/workflow-chat/chat'
};
