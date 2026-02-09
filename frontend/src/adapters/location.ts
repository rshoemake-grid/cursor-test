/**
 * Location Adapter Factory
 * Follows Single Responsibility Principle - only handles location adapter creation
 */

import type { WindowLocation } from '../types/adapters'
import { isBrowserEnvironment } from '../utils/environment'

/**
 * Default location values for fallback
 * Follows DRY principle by eliminating duplicated default values
 */
const DEFAULT_LOCATION: WindowLocation = {
  protocol: 'http:',
  host: 'localhost:8000',
  hostname: 'localhost',
  port: '8000',
  pathname: '/',
  search: '',
  hash: '',
} as const

/**
 * Location Adapter Factory
 * Provides factory methods for creating location adapters
 */
export const LocationAdapterFactory = {
  /**
   * Create default window location adapter
   */
  createWindowLocation(): WindowLocation | null {
    if (!isBrowserEnvironment()) {
      return null
    }
    // Handle test environments where location might not be fully available
    try {
      return {
        protocol: window.location?.protocol || DEFAULT_LOCATION.protocol,
        host: window.location?.host || DEFAULT_LOCATION.host,
        hostname: window.location?.hostname || DEFAULT_LOCATION.hostname,
        port: window.location?.port || DEFAULT_LOCATION.port,
        pathname: window.location?.pathname || DEFAULT_LOCATION.pathname,
        search: window.location?.search || DEFAULT_LOCATION.search,
        hash: window.location?.hash || DEFAULT_LOCATION.hash,
      }
    } catch {
      // Fallback for test environments
      return DEFAULT_LOCATION
    }
  },
}
