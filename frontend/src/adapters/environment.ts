/**
 * Environment Adapter Factory
 * Follows Single Responsibility Principle - only handles environment adapter creation
 */

import type { EnvironmentAdapter } from '../types/adapters'

/**
 * Environment Adapter Factory
 * Provides factory methods for creating environment adapters
 */
export const EnvironmentAdapterFactory = {
  /**
   * Create default environment adapter
   */
  createEnvironmentAdapter(): EnvironmentAdapter {
    return {
      isDevelopment: () =>
        process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV !== 'production',
      isProduction: () => process.env.NODE_ENV === 'production',
      get: (key: string) => process.env[key],
    }
  },
}
