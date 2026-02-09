/**
 * WebSocket Factory
 * Follows Single Responsibility Principle - only handles WebSocket factory creation
 */

import type { WebSocketFactory } from '../types/adapters'

/**
 * WebSocket Factory Factory
 * Provides factory methods for creating WebSocket factories
 */
export const WebSocketFactoryFactory = {
  /**
   * Create default WebSocket factory
   */
  createWebSocketFactory(): WebSocketFactory {
    return {
      create: (url: string) => new WebSocket(url),
    }
  },
}
