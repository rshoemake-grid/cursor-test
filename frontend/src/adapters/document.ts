/**
 * Document Adapter Factory
 * Follows Single Responsibility Principle - only handles document adapter creation
 * Separated from other adapters to improve maintainability and testability
 */

import type { DocumentAdapter } from '../types/adapters'
import { isBrowserEnvironment } from '../utils/environment'

/**
 * Document Adapter Factory
 * Provides factory methods for creating document adapters
 */
export const DocumentAdapterFactory = {
  /**
   * Create default document adapter
   */
  createDocumentAdapter(): DocumentAdapter | null {
    if (!isBrowserEnvironment()) {
      return null
    }
    return {
      createElement: (tag: string) => document.createElement(tag),
      getElementById: (id: string) => document.getElementById(id),
      getActiveElement: () => document.activeElement,
      head: document.head,
      body: document.body,
    }
  },
}
