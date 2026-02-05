# Low Scoring Files Analysis - SOLID & DRY Improvement Opportunities

## Date: 2026-02-05

## Executive Summary

This document analyzes the lowest-scoring files from mutation testing and provides detailed recommendations for improving code organization, SOLID principles adherence, and DRY compliance.

**Current Mutation Scores (Lowest to Highest):**
1. `formUtils.ts` - **31.11%** (14 killed, 2 survived, 29 no coverage)
2. `nodePositioning.ts` - **31.75%** (20 killed, 3 survived, 40 no coverage)
3. `apiUtils.ts` - **43.06%** (31 killed, 14 survived, 27 no coverage) ⚠️ Already refactored
4. `useWebSocket.ts` - **48.81%** (82 killed, 57 survived, 29 no coverage)
5. `useSelectedNode.ts` - **60.98%** (25 killed, 16 survived, 0 no coverage)
6. `useAuthenticatedApi.ts` - **60.61%** (20 killed, 3 survived, 10 no coverage) ⚠️ Already refactored

---

## 1. formUtils.ts (31.11% mutation score) - **CRITICAL**

### Current Issues

#### DRY Violations
- Path parsing logic duplicated: `Array.isArray(path) ? path : path.split('.')` appears in all 3 functions
- No centralized path parsing utility
- Similar null/undefined checks repeated

#### SOLID Violations
- **Single Responsibility**: Functions mix path parsing, validation, and value manipulation
- **Open/Closed**: Adding new path operations requires modifying existing functions
- **Dependency Inversion**: Tightly coupled to object structure

#### Code Smells
- No type safety for nested operations
- No validation of path format
- No handling of edge cases (array indices, special characters)
- Missing abstraction for path operations

### Recommended Approach

#### Extract Path Parser Utility (Strategy Pattern)

```typescript
// New file: hooks/utils/pathParser.ts

/**
 * Path Parser Utility
 * Single Responsibility: Only parses and validates paths
 */
export class PathParser {
  /**
   * Parse path string or array into normalized array
   * DRY: Single source of truth for path parsing
   */
  static parse(path: string | string[]): string[] {
    if (Array.isArray(path)) {
      return path.filter(Boolean) // Remove empty strings
    }
    if (typeof path === 'string') {
      return path.split('.').filter(Boolean)
    }
    return []
  }

  /**
   * Validate path format
   * Single Responsibility: Only validates
   */
  static validate(path: string | string[]): boolean {
    const keys = this.parse(path)
    return keys.length > 0 && keys.every(key => {
      // Validate key format (no empty strings, no special chars that break)
      return typeof key === 'string' && key.length > 0 && /^[a-zA-Z0-9_]+$/.test(key)
    })
  }

  /**
   * Check if path contains array indices
   */
  static hasArrayIndices(path: string | string[]): boolean {
    const keys = this.parse(path)
    return keys.some(key => /^\d+$/.test(key))
  }
}
```

#### Refactored formUtils.ts with Better Abstraction

```typescript
// Refactored formUtils.ts

import { PathParser } from './pathParser'

/**
 * Traverse object using path keys
 * Single Responsibility: Only traverses
 */
function traversePath(obj: any, keys: string[]): { value: any; parent: any; lastKey: string } | null {
  if (!obj || keys.length === 0) return null

  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (current === null || current === undefined) {
      return null
    }
    current = current[key]
  }

  return {
    value: current,
    parent: current,
    lastKey: keys[keys.length - 1]
  }
}

/**
 * Get nested value from object using path
 * Uses PathParser for DRY compliance
 */
export function getNestedValue<T = any>(
  obj: any,
  path: string | string[],
  defaultValue?: T
): T | undefined {
  if (!obj || !path) return defaultValue

  const keys = PathParser.parse(path)
  if (keys.length === 0) return defaultValue

  const result = traversePath(obj, keys)
  if (!result) return defaultValue

  return result.value?.[result.lastKey] as T
}

/**
 * Set nested value in object using path
 * Single Responsibility: Only sets values
 * Uses PathParser for DRY compliance
 */
export function setNestedValue<T extends Record<string, any>>(
  obj: T,
  path: string | string[],
  value: any
): T {
  if (!obj || !path || !PathParser.validate(path)) {
    return obj
  }

  const keys = PathParser.parse(path)
  if (keys.length === 0) return obj

  const result = { ...obj } as any
  let current = result

  // Traverse to parent of target
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    
    // Handle null/undefined intermediate values
    if (current[key] === null || current[key] === undefined) {
      current[key] = {}
    } else if (typeof current[key] === 'object' && !Array.isArray(current[key])) {
      // Clone object to avoid mutation
      current[key] = { ...current[key] }
    } else {
      // Invalid path - intermediate value is not an object
      return obj
    }
    current = current[key]
  }

  // Set the value
  current[keys[keys.length - 1]] = value
  return result as T
}

/**
 * Check if nested value exists
 * Uses composition - calls getNestedValue
 * DRY: Reuses existing logic
 */
export function hasNestedValue(obj: any, path: string | string[]): boolean {
  return getNestedValue(obj, path) !== undefined
}
```

**Benefits:**
- ✅ DRY: Path parsing in one place
- ✅ Single Responsibility: Each function has one job
- ✅ Better error handling
- ✅ Type safety improvements
- ✅ Extensible for new path operations
- ✅ Expected improvement: 31% → 60%+ mutation score

---

## 2. nodePositioning.ts (31.75% mutation score) - **HIGH PRIORITY**

### Current Issues

#### DRY Violations
- Default options merging duplicated: `{ ...DEFAULT_OPTIONS, ...options }` in every function
- Max position calculation duplicated (`getMaxNodeX`, `getMaxNodeY` called multiple times)
- Position calculation patterns repeated across functions

#### SOLID Violations
- **Single Responsibility**: Functions mix option merging, position calculation, and array generation
- **Open/Closed**: Adding new positioning strategies requires new functions
- **No Strategy Pattern**: Each positioning algorithm is a separate function

#### Code Smells
- No abstraction for positioning strategies
- Hard to extend with new positioning algorithms
- Similar position calculation logic duplicated

### Recommended Approach

#### Strategy Pattern for Positioning Algorithms

```typescript
// New file: hooks/utils/positioningStrategies.ts

import type { Node } from '@xyflow/react'
import type { Position, NodePositioningOptions } from './nodePositioning'

/**
 * Base positioning strategy interface
 * Open/Closed: Extensible without modification
 */
interface PositioningStrategy {
  calculatePositions(
    existingNodes: Node[],
    count: number,
    options: Required<NodePositioningOptions>
  ): Position[]
}

/**
 * Horizontal positioning strategy
 * Single Responsibility: Only handles horizontal positioning
 */
class HorizontalStrategy implements PositioningStrategy {
  calculatePositions(
    existingNodes: Node[],
    count: number,
    options: Required<NodePositioningOptions>
  ): Position[] {
    if (existingNodes.length === 0) {
      return Array.from({ length: count }, (_, i) => ({
        x: options.defaultX + (i * options.horizontalSpacing),
        y: options.defaultY
      }))
    }

    const maxX = Math.max(...existingNodes.map(n => n.position.x))
    return Array.from({ length: count }, (_, i) => ({
      x: maxX + options.horizontalSpacing + (i * options.horizontalSpacing),
      y: options.defaultY
    }))
  }
}

/**
 * Vertical positioning strategy
 * Single Responsibility: Only handles vertical positioning
 */
class VerticalStrategy implements PositioningStrategy {
  calculatePositions(
    existingNodes: Node[],
    count: number,
    options: Required<NodePositioningOptions>
  ): Position[] {
    if (existingNodes.length === 0) {
      return Array.from({ length: count }, (_, i) => ({
        x: options.defaultX,
        y: options.defaultY + (i * options.verticalSpacing)
      }))
    }

    const maxX = Math.max(...existingNodes.map(n => n.position.x))
    return Array.from({ length: count }, (_, i) => ({
      x: maxX + options.horizontalSpacing,
      y: options.defaultY + (i * options.verticalSpacing)
    }))
  }
}

/**
 * Grid positioning strategy
 * Single Responsibility: Only handles grid positioning
 */
class GridStrategy implements PositioningStrategy {
  constructor(private columnsPerRow: number = 3) {}

  calculatePositions(
    existingNodes: Node[],
    count: number,
    options: Required<NodePositioningOptions>
  ): Position[] {
    let startX = options.defaultX
    let startY = options.defaultY

    if (existingNodes.length > 0) {
      const maxX = Math.max(...existingNodes.map(n => n.position.x))
      const maxY = Math.max(...existingNodes.map(n => n.position.y))
      startX = maxX + options.horizontalSpacing
      startY = Math.max(options.defaultY, maxY)
    }

    return Array.from({ length: count }, (_, index) => {
      const row = Math.floor(index / this.columnsPerRow)
      const col = index % this.columnsPerRow
      return {
        x: startX + (col * options.horizontalSpacing),
        y: startY + (row * options.verticalSpacing)
      }
    })
  }
}

/**
 * Strategy factory
 * Factory Pattern: Creates appropriate strategy
 */
export function createPositioningStrategy(
  type: 'horizontal' | 'vertical' | 'grid',
  columnsPerRow?: number
): PositioningStrategy {
  switch (type) {
    case 'horizontal':
      return new HorizontalStrategy()
    case 'vertical':
      return new VerticalStrategy()
    case 'grid':
      return new GridStrategy(columnsPerRow)
    default:
      return new HorizontalStrategy()
  }
}
```

#### Refactored nodePositioning.ts

```typescript
// Refactored nodePositioning.ts

import type { Node } from '@xyflow/react'
import { createPositioningStrategy } from './positioningStrategies'

export interface Position {
  x: number
  y: number
}

export interface NodePositioningOptions {
  horizontalSpacing?: number
  verticalSpacing?: number
  defaultX?: number
  defaultY?: number
}

const DEFAULT_OPTIONS: Required<NodePositioningOptions> = {
  horizontalSpacing: 200,
  verticalSpacing: 150,
  defaultX: 250,
  defaultY: 250,
}

/**
 * Merge options with defaults
 * DRY: Single source of truth for option merging
 */
function mergeOptions(options: NodePositioningOptions = {}): Required<NodePositioningOptions> {
  return { ...DEFAULT_OPTIONS, ...options }
}

/**
 * Get maximum X position from nodes
 * Single Responsibility: Only calculates max X
 */
export function getMaxNodeX(nodes: Node[]): number {
  if (nodes.length === 0) return 0
  return Math.max(...nodes.map(n => n.position.x))
}

/**
 * Get maximum Y position from nodes
 * Single Responsibility: Only calculates max Y
 */
export function getMaxNodeY(nodes: Node[]): number {
  if (nodes.length === 0) return 0
  return Math.max(...nodes.map(n => n.position.y))
}

/**
 * Calculate next node position (horizontal)
 * Uses strategy pattern internally
 */
export function calculateNextNodePosition(
  existingNodes: Node[],
  options: NodePositioningOptions = {}
): Position {
  const opts = mergeOptions(options)
  const strategy = createPositioningStrategy('horizontal')
  const positions = strategy.calculatePositions(existingNodes, 1, opts)
  return positions[0]
}

/**
 * Calculate multiple node positions (vertical)
 * Uses strategy pattern internally
 */
export function calculateMultipleNodePositions(
  existingNodes: Node[],
  count: number,
  options: NodePositioningOptions = {}
): Position[] {
  const opts = mergeOptions(options)
  const strategy = createPositioningStrategy('vertical')
  return strategy.calculatePositions(existingNodes, count, opts)
}

/**
 * Calculate grid positions
 * Uses strategy pattern internally
 */
export function calculateGridPosition(
  existingNodes: Node[],
  count: number,
  columnsPerRow: number = 3,
  options: NodePositioningOptions = {}
): Position[] {
  const opts = mergeOptions(options)
  const strategy = createPositioningStrategy('grid', columnsPerRow)
  return strategy.calculatePositions(existingNodes, count, opts)
}

/**
 * Calculate position relative to reference node
 * Single Responsibility: Only calculates relative position
 */
export function calculateRelativePosition(
  referenceNode: Node,
  offset: Position = { x: 200, y: 0 }
): Position {
  return {
    x: referenceNode.position.x + offset.x,
    y: referenceNode.position.y + offset.y,
  }
}
```

**Benefits:**
- ✅ Strategy Pattern: Easy to add new positioning algorithms
- ✅ DRY: Option merging and max calculation in one place
- ✅ Single Responsibility: Each strategy handles one positioning type
- ✅ Open/Closed: Extensible without modification
- ✅ Expected improvement: 32% → 65%+ mutation score

---

## 3. useWebSocket.ts (48.81% mutation score) - **HIGH PRIORITY**

### Current Issues

#### DRY Violations
- Connection skip logic duplicated in `connect()` and `useEffect`
- Status checking logic repeated multiple times
- Logging patterns duplicated
- Cleanup logic duplicated in multiple places

#### SOLID Violations
- **Single Responsibility**: Hook manages connection, reconnection, status tracking, cleanup, and React lifecycle
- **Separation of Concerns**: Business logic mixed with React lifecycle hooks
- **Tight Coupling**: WebSocket logic tightly coupled to React hooks

#### Code Smells
- Large hook (255 lines) doing too much
- Complex `useEffect` dependencies
- Connection management logic spread across multiple `useEffect` hooks
- Difficult to test WebSocket logic independently

### Recommended Approach

#### Extract WebSocket Connection Manager (Separation of Concerns)

```typescript
// New file: hooks/utils/WebSocketConnectionManager.ts

import type { WebSocketFactory, WindowLocation } from '../../types/adapters'
import {
  getWebSocketStateText,
  isTemporaryExecutionId,
  isExecutionTerminated,
  shouldSkipConnection,
  buildWebSocketUrl,
  calculateReconnectDelay,
  shouldReconnect,
  handleWebSocketMessage,
  type ExecutionStatus,
  type WebSocketMessage
} from './useWebSocket.utils'

export interface WebSocketCallbacks {
  onLog?: (log: WebSocketMessage['log']) => void
  onStatus?: (status: string) => void
  onNodeUpdate?: (nodeId: string, nodeState: any) => void
  onCompletion?: (result: any) => void
  onError?: (error: string) => void
}

export interface WebSocketManagerConfig {
  executionId: string | null
  executionStatus?: ExecutionStatus
  maxReconnectAttempts: number
  webSocketFactory: WebSocketFactory
  windowLocation: WindowLocation | null
  logger: typeof logger
}

/**
 * WebSocket Connection Manager
 * Single Responsibility: Only manages WebSocket connection lifecycle
 * Separated from React lifecycle for better testability
 */
export class WebSocketConnectionManager {
  private ws: WebSocket | null = null
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private lastKnownStatus?: ExecutionStatus

  constructor(private config: WebSocketManagerConfig) {
    this.lastKnownStatus = config.executionStatus
  }

  /**
   * Update execution status
   * Single Responsibility: Only updates status
   */
  updateStatus(status: ExecutionStatus | undefined): void {
    this.lastKnownStatus = status || this.lastKnownStatus

    // Close connection if execution terminated
    if (status && isExecutionTerminated(status)) {
      this.close('Execution completed')
    }
  }

  /**
   * Connect to WebSocket
   * Single Responsibility: Only establishes connection
   */
  connect(callbacks: WebSocketCallbacks): void {
    // Check if should skip
    if (shouldSkipConnection(
      this.config.executionId,
      this.config.executionStatus,
      this.lastKnownStatus
    )) {
      this.logSkipReason()
      return
    }

    // Close existing connection
    this.close()

    const wsUrl = buildWebSocketUrl(this.config.executionId!, this.config.windowLocation)
    this.config.logger.debug(`[WebSocket] Connecting to ${wsUrl}`)

    try {
      const ws = this.config.webSocketFactory.create(wsUrl)
      this.ws = ws
      this.setupEventHandlers(ws, callbacks, wsUrl)
    } catch (error) {
      this.config.logger.error('[WebSocket] Failed to create connection:', error)
      this.handleConnectionError(error, callbacks)
    }
  }

  /**
   * Setup WebSocket event handlers
   * Single Responsibility: Only sets up handlers
   */
  private setupEventHandlers(
    ws: WebSocket,
    callbacks: WebSocketCallbacks,
    wsUrl: string
  ): void {
    ws.onopen = () => {
      this.config.logger.debug(`[WebSocket] Connected`)
      this.reconnectAttempts = 0
      callbacks.onStatus?.('connected')
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        handleWebSocketMessage(message, {
          ...callbacks,
          logger: this.config.logger
        })
      } catch (error) {
        this.config.logger.error('[WebSocket] Failed to parse message:', error)
      }
    }

    ws.onerror = (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.config.logger.error('[WebSocket] Connection error:', {
        message: errorMessage,
        readyState: getWebSocketStateText(ws.readyState),
        url: wsUrl
      })
      callbacks.onStatus?.('error')
    }

    ws.onclose = (event) => {
      this.config.logger.debug('[WebSocket] Disconnected', {
        code: event.code,
        reason: event.reason || 'No reason provided',
        wasClean: event.wasClean
      })
      this.ws = null
      callbacks.onStatus?.('disconnected')

      this.handleReconnection(event, callbacks)
    }
  }

  /**
   * Handle reconnection logic
   * Single Responsibility: Only handles reconnection
   */
  private handleReconnection(
    event: CloseEvent,
    callbacks: WebSocketCallbacks
  ): void {
    if (!shouldReconnect(
      event.wasClean,
      event.code,
      this.reconnectAttempts,
      this.config.maxReconnectAttempts,
      this.config.executionId,
      this.config.executionStatus,
      this.lastKnownStatus
    )) {
      this.logSkipReconnectReason(event)
      return
    }

    this.reconnectAttempts++
    const delay = calculateReconnectDelay(this.reconnectAttempts, 10000)
    this.config.logger.debug(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`)

    this.reconnectTimeout = setTimeout(() => {
      this.connect(callbacks)
    }, delay)

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.config.logger.warn(`[WebSocket] Max reconnect attempts reached`)
      callbacks.onError?.(`WebSocket connection failed after ${this.config.maxReconnectAttempts} attempts`)
    }
  }

  /**
   * Close connection
   * Single Responsibility: Only closes connection
   */
  close(reason?: string): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close(1000, reason)
      this.ws = null
    }
  }

  /**
   * Get connection state
   */
  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  /**
   * Reset reconnect attempts
   */
  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0
  }

  // Helper methods for logging (DRY)
  private logSkipReason(): void {
    if (isTemporaryExecutionId(this.config.executionId)) {
      this.config.logger.debug(`[WebSocket] Skipping connection to temporary execution ID`)
    } else {
      const status = this.config.executionStatus || this.lastKnownStatus
      if (status === 'completed' || status === 'failed') {
        this.config.logger.debug(`[WebSocket] Skipping connection - execution is ${status}`)
      }
    }
  }

  private logSkipReconnectReason(event: CloseEvent): void {
    if (isTemporaryExecutionId(this.config.executionId)) {
      this.config.logger.debug(`[WebSocket] Skipping reconnect for temporary execution ID`)
    } else {
      const status = this.config.executionStatus || this.lastKnownStatus
      if (status === 'completed' || status === 'failed') {
        this.config.logger.debug(`[WebSocket] Skipping reconnect - execution is ${status}`)
      } else if (event.wasClean && event.code === 1000) {
        this.config.logger.debug(`[WebSocket] Connection closed cleanly, not reconnecting`)
      }
    }
  }

  private handleConnectionError(error: any, callbacks: WebSocketCallbacks): void {
    callbacks.onStatus?.('error')
    callbacks.onError?.(error instanceof Error ? error.message : 'Failed to create WebSocket connection')
  }
}
```

#### Simplified Hook (React Lifecycle Only)

```typescript
// Refactored useWebSocket.ts (reduced from 255 to ~80 lines)

import { useEffect, useRef, useState } from 'react'
import { logger } from '../utils/logger'
import type { WebSocketFactory, WindowLocation } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'
import {
  WebSocketConnectionManager,
  type WebSocketCallbacks
} from './utils/WebSocketConnectionManager'
import type { ExecutionStatus } from './useWebSocket.utils'

interface UseWebSocketOptions {
  executionId: string | null
  executionStatus?: ExecutionStatus
  onLog?: (log: any) => void
  onStatus?: (status: string) => void
  onNodeUpdate?: (nodeId: string, nodeState: any) => void
  onCompletion?: (result: any) => void
  onError?: (error: string) => void
  webSocketFactory?: WebSocketFactory
  windowLocation?: WindowLocation | null
  logger?: typeof logger
}

export function useWebSocket(options: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const managerRef = useRef<WebSocketConnectionManager | null>(null)

  // Initialize manager once
  if (!managerRef.current) {
    managerRef.current = new WebSocketConnectionManager({
      executionId: options.executionId,
      executionStatus: options.executionStatus,
      maxReconnectAttempts: 5,
      webSocketFactory: options.webSocketFactory || defaultAdapters.createWebSocketFactory(),
      windowLocation: options.windowLocation || defaultAdapters.createWindowLocation(),
      logger: options.logger || logger
    })
  }

  // Update manager state when props change
  useEffect(() => {
    managerRef.current?.updateStatus(options.executionStatus)
  }, [options.executionStatus])

  // Handle connection lifecycle
  useEffect(() => {
    const manager = managerRef.current
    if (!manager) return

    // Reset attempts when execution ID changes
    manager.resetReconnectAttempts()

    const callbacks: WebSocketCallbacks = {
      onLog: options.onLog,
      onStatus: (status) => {
        setIsConnected(status === 'connected')
        options.onStatus?.(status)
      },
      onNodeUpdate: options.onNodeUpdate,
      onCompletion: options.onCompletion,
      onError: options.onError
    }

    if (options.executionId) {
      manager.connect(callbacks)
    } else {
      manager.close()
      setIsConnected(false)
    }

    return () => {
      manager.close()
      setIsConnected(false)
    }
  }, [options.executionId, options.onLog, options.onStatus, options.onNodeUpdate, options.onCompletion, options.onError])

  return { isConnected }
}
```

**Benefits:**
- ✅ Separation of Concerns: Manager handles WebSocket, Hook handles React
- ✅ Single Responsibility: Each class/function has one job
- ✅ DRY: Connection logic in one place
- ✅ Testability: Manager can be tested independently
- ✅ Reusability: Manager can be used outside React
- ✅ Expected improvement: 49% → 75%+ mutation score

---

## 4. useSelectedNode.ts (60.98% mutation score) - **MEDIUM PRIORITY**

### Current Issues

#### SOLID Violations
- **Single Responsibility**: Hook mixes caching, node finding, and React memoization
- **Complex Logic**: useMemo dependencies and cache invalidation logic intertwined

#### Code Smells
- Complex cache invalidation logic
- Difficult to test due to React useMemo memoization
- Cache update logic mixes concerns (finding, updating, returning)

### Recommended Approach

#### Extract Node Cache Manager

```typescript
// New file: hooks/utils/NodeCacheManager.ts

/**
 * Node Cache Manager
 * Single Responsibility: Only manages node caching
 */
export class NodeCacheManager {
  private cachedNode: any = null
  private cachedNodeId: string | null = null

  /**
   * Get cached node if ID matches
   */
  getCached(nodeId: string | null): any | null {
    if (!nodeId || this.cachedNodeId !== nodeId) {
      return null
    }
    return this.cachedNode
  }

  /**
   * Cache a node
   */
  cache(nodeId: string, node: any): void {
    this.cachedNodeId = nodeId
    this.cachedNode = node ? { ...node } : null
  }

  /**
   * Update cached node data
   */
  updateCache(updatedNode: any): void {
    if (this.cachedNode && updatedNode) {
      Object.assign(this.cachedNode, updatedNode)
    }
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cachedNode = null
    this.cachedNodeId = null
  }

  /**
   * Check if cache is valid for node ID
   */
  isValidFor(nodeId: string | null): boolean {
    return nodeId !== null && this.cachedNodeId === nodeId && this.cachedNode !== null
  }
}
```

#### Refactored Hook

```typescript
// Refactored useSelectedNode.ts

import { useMemo, useRef } from 'react'
import { useReactFlow } from '@xyflow/react'
import { findNodeById, nodeExists } from '../utils/nodeUtils'
import { NodeCacheManager } from './utils/NodeCacheManager'

export function useSelectedNode({
  selectedNodeId,
  nodesProp,
}: UseSelectedNodeOptions) {
  const { getNodes } = useReactFlow()
  const cacheManagerRef = useRef(new NodeCacheManager())

  const nodes = useMemo(() => {
    try {
      const flowNodes = getNodes()
      return flowNodes.length > 0 ? flowNodes : (nodesProp || [])
    } catch {
      return nodesProp || []
    }
  }, [getNodes, nodesProp])

  const selectedNode = useMemo(() => {
    const cacheManager = cacheManagerRef.current

    // Clear cache if no selection
    if (!selectedNodeId) {
      cacheManager.clear()
      return null
    }

    // Check cache first
    const cached = cacheManager.getCached(selectedNodeId)
    if (cached) {
      // Verify node still exists
      if (nodeExists(selectedNodeId, getNodes, nodes)) {
        // Update cache with latest data
        const updated = findNodeById(selectedNodeId, getNodes, nodes)
        if (updated) {
          cacheManager.updateCache(updated)
          return cached // Return cached reference for stability
        }
      }
    }

    // Find node
    const found = findNodeById(selectedNodeId, getNodes, nodes)

    // Cache it
    if (found) {
      cacheManager.cache(selectedNodeId, found)
    } else {
      cacheManager.clear()
    }

    return found
  }, [selectedNodeId, getNodes, nodes])

  return { selectedNode, nodes }
}
```

**Benefits:**
- ✅ Single Responsibility: Cache manager handles caching, hook handles React
- ✅ Testability: Cache manager can be tested independently
- ✅ Clearer logic separation
- ✅ Expected improvement: 61% → 75%+ mutation score

---

## Implementation Priority

### Phase 1: Critical (High Impact, Low Risk)
1. **formUtils.ts** - Simple refactor, high improvement potential
   - Estimated improvement: 31% → 60%+
   - Time: 2-3 hours
   - Risk: Low

### Phase 2: High Value
2. **nodePositioning.ts** - Good for extensibility
   - Estimated improvement: 32% → 65%+
   - Time: 3-4 hours
   - Risk: Low

3. **useWebSocket.ts** - Significant complexity reduction
   - Estimated improvement: 49% → 75%+
   - Time: 4-6 hours
   - Risk: Medium (needs thorough testing)

### Phase 3: Medium Priority
4. **useSelectedNode.ts** - Incremental improvement
   - Estimated improvement: 61% → 75%+
   - Time: 2-3 hours
   - Risk: Low

---

## Expected Overall Impact

**Before:**
- Average mutation score of low files: ~40%
- Code duplication: High
- Maintainability: Low

**After:**
- Average mutation score: ~70%+
- Code duplication: Minimal
- Maintainability: High
- Code reduction: ~200+ lines eliminated
- Better testability and extensibility

---

## Design Patterns Used

1. **Strategy Pattern** - Positioning strategies, path parsing strategies
2. **Factory Pattern** - Strategy creation, manager creation
3. **Separation of Concerns** - Business logic separated from React lifecycle
4. **Composition** - Reusable utilities composed into higher-level functions
5. **Single Responsibility** - Each class/function has one clear purpose

---

## Testing Strategy

For each refactored file:
1. **Unit tests** for extracted utilities/managers
2. **Integration tests** for hook behavior
3. **Mutation tests** to verify improvements
4. **Regression tests** to ensure backward compatibility

---

## Conclusion

The primary issues are:
- **DRY violations** - Duplicated logic across functions
- **Single Responsibility violations** - Functions doing too much
- **Missing abstractions** - No strategy/factory patterns for extensibility
- **Tight coupling** - Business logic mixed with framework code

By extracting common patterns, applying SOLID principles, and using appropriate design patterns, we can:
- Improve mutation scores from ~40% to ~70%+
- Reduce code duplication significantly
- Improve maintainability and testability
- Make codebase more extensible

The refactoring follows established design patterns and maintains backward compatibility while significantly improving code quality.
