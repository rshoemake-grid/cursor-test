/**
 * Marketplace Constants
 * Centralized constants for marketplace operations to prevent string literal mutations
 * DRY: Single source of truth for magic values
 */ /**
 * Pending agents storage key
 */ export const PENDING_AGENTS_STORAGE_KEY = 'pendingAgentsToAdd';
/**
 * Pending tools storage key
 */ export const PENDING_TOOLS_STORAGE_KEY = 'pendingToolsToAdd';
/**
 * Pending agents validation constants
 */ export const PENDING_AGENTS = {
    MAX_AGE: 10000,
    MAX_CHECKS: 10,
    CHECK_INTERVAL: 1000
};
/**
 * Agent node constants
 */ export const AGENT_NODE = {
    DEFAULT_LABEL: 'Agent Node',
    SPACING: 150,
    TYPE: 'agent'
};
/**
 * Tool node constants
 */ export const TOOL_NODE = {
    DEFAULT_LABEL: 'Tool Node',
    SPACING: 150,
    TYPE: 'tool'
};
/**
 * Draft update delay constants
 */ export const DRAFT_UPDATE = {
    IMMEDIATE_DELAY: 0,
    FLAG_RESET_DELAY: 1000
};
