/**
 * Console Adapter Factory
 * Follows Single Responsibility Principle - only handles console adapter creation
 */

import type { ConsoleAdapter } from '../types/adapters'

/**
 * Console Adapter Factory
 * Provides factory methods for creating console adapters
 */
export const ConsoleAdapterFactory = {
  /**
   * Create default console adapter
   */
  createConsoleAdapter(): ConsoleAdapter {
    if (typeof console === 'undefined') {
      return {
        log: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      }
    }
    return {
      log: (...args: any[]) => console.log(...args),
      info: (...args: any[]) => console.info(...args),
      warn: (...args: any[]) => console.warn(...args),
      error: (...args: any[]) => console.error(...args),
      debug: (...args: any[]) => {
        if (console.debug) {
          console.debug(...args)
        } else {
          console.log(...args)
        }
      },
    }
  },
}
