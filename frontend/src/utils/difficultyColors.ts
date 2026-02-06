/**
 * Difficulty Color Utilities
 * Extracted from MarketplacePage to improve DRY compliance
 * Single Responsibility: Only handles difficulty color mapping
 */

/**
 * Difficulty level type
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

/**
 * Get color classes for difficulty level
 * DRY: Centralized color mapping
 * Mutation-resistant: uses explicit string comparisons
 */
export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-800'
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800'
    case 'advanced':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
