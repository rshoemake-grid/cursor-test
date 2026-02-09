/**
 * Timer Adapter Factory
 * Follows Single Responsibility Principle - only handles timer adapter creation
 */

import type { TimerAdapter } from '../types/adapters'

/**
 * Timer Adapter Factory
 * Provides factory methods for creating timer adapters
 */
export const TimerAdapterFactory = {
  /**
   * Create default timer adapter
   */
  createTimerAdapter(): TimerAdapter {
    return {
      setTimeout: ((callback: () => void, delay: number) => {
        return setTimeout(callback, delay) as unknown as number
      }) as TimerAdapter['setTimeout'],
      clearTimeout: (id: number) => clearTimeout(id),
      setInterval: ((callback: () => void, delay: number) => {
        return setInterval(callback, delay) as unknown as number
      }) as TimerAdapter['setInterval'],
      clearInterval: (id: number) => clearInterval(id),
    }
  },
}
