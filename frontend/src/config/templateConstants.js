/**
 * Template Constants
 * Centralized definitions for template categories and difficulties
 * Used across WorkflowTabs, MarketplaceDialog, and WorkflowList components
 */ export const TEMPLATE_CATEGORIES = [
    'content_creation',
    'data_analysis',
    'customer_service',
    'research',
    'automation',
    'education',
    'marketing',
    'other'
];
export const TEMPLATE_DIFFICULTIES = [
    'beginner',
    'intermediate',
    'advanced'
];
/**
 * Format category for display (replace underscores with spaces)
 */ export function formatCategory(category) {
    return category.replace(/_/g, ' ');
}
/**
 * Format difficulty for display (capitalize first letter)
 */ export function formatDifficulty(difficulty) {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}
