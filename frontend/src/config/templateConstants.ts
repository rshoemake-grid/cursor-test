/**
 * Template Constants
 * Centralized definitions for template categories and difficulties
 * Used across WorkflowTabs, MarketplaceDialog, and WorkflowList components
 */

export const TEMPLATE_CATEGORIES = [
  'content_creation',
  'data_analysis',
  'customer_service',
  'research',
  'automation',
  'education',
  'marketing',
  'other'
] as const

export const TEMPLATE_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number]
export type TemplateDifficulty = typeof TEMPLATE_DIFFICULTIES[number]

/**
 * Format category for display (replace underscores with spaces)
 */
export function formatCategory(category: TemplateCategory): string {
  return category.replace(/_/g, ' ')
}

/**
 * Format difficulty for display (capitalize first letter)
 */
export function formatDifficulty(difficulty: TemplateDifficulty): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}
