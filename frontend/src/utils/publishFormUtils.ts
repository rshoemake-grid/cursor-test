/**
 * Publish form utilities
 * DRY: Shared logic for publish forms across WorkflowList, MarketplaceDialog, PublishModal
 */

import type { TemplateCategory, TemplateDifficulty } from '../config/templateConstants'

/**
 * Parse comma-separated tags string into trimmed non-empty array
 */
export function parseTags(tags: string): string[] {
  return tags.split(',').map((t) => t.trim()).filter(Boolean)
}

export interface DefaultPublishForm {
  category: TemplateCategory
  tags: string
  difficulty: TemplateDifficulty
  estimated_time: string
}

/**
 * Default values for publish forms
 */
export function getDefaultPublishForm(): DefaultPublishForm {
  return {
    category: 'automation',
    tags: '',
    difficulty: 'beginner',
    estimated_time: '',
  }
}
