/**
 * API Domain Hooks
 * Centralized exports for API-related hooks
 * 
 * This barrel export maintains consistency with other domain index files.
 * All domains follow the same pattern of using index.ts for exports, which:
 * - Provides a consistent import pattern across domains
 * - Makes it easy to add more API hooks in the future
 * - Aligns with the domain-based organization structure
 * 
 * Usage:
 *   import { useAuthenticatedApi } from '../hooks/api'
 */

export { useAuthenticatedApi } from './useAuthenticatedApi'
