/**
 * WebSocket URL Builder
 * Extracted for better testability and Single Responsibility
 * Single Responsibility: Only handles WebSocket URL building
 */

import type { WindowLocation } from '../../types/adapters'
import { logicalOr } from './logicalOr'

/**
 * Build WebSocket URL from window location and execution ID
 * Mutation-resistant: explicit null checks
 */
export function buildWebSocketUrl(
  executionId: string,
  windowLocation?: WindowLocation | null
): string {
  const protocol = windowLocation?.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = logicalOr(windowLocation?.host, 'localhost:8000')
  return `${protocol}//${host}/ws/executions/${executionId}`
}
