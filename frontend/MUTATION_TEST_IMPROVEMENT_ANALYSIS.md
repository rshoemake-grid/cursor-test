# Mutation Test Improvement Analysis
## Code Organization, SOLID, and DRY Principles

Based on mutation test results, this document analyzes files with low mutation scores and provides recommendations for improving code organization, SOLID principles adherence, and DRY violations.

---

## Executive Summary

**Files Analyzed:**
1. `apiUtils.ts` - 40.98% mutation score
2. `useAuthenticatedApi.ts` - 46.15% mutation score  
3. `useWebSocket.ts` - 49.40% mutation score
4. `nodePositioning.ts` - 31.75% mutation score
5. `formUtils.ts` - 31.11% mutation score

**Key Issues Identified:**
- **Massive DRY violations** in `useAuthenticatedApi.ts` (500+ lines of duplicated error handling)
- **Single Responsibility Principle violations** - methods doing too much
- **Code duplication** across header building functions
- **Missing abstractions** for common patterns
- **Tight coupling** between concerns

---

## 1. apiUtils.ts (40.98% mutation score)

### Current Issues

#### DRY Violations
- `buildJsonHeaders()` duplicates logic from `buildAuthHeaders()`
- `buildUploadHeaders()` is essentially a no-op wrapper
- Three separate functions for similar header building patterns

#### SOLID Violations
- **Single Responsibility**: Functions mix header building with content-type logic
- **Open/Closed**: Adding new header types requires new functions instead of extending

### Recommendations

#### Refactor to Use Composition Pattern

```typescript
// Proposed refactored apiUtils.ts
export interface HeaderBuilderOptions {
  contentType?: string | null  // null means omit Content-Type
  token?: string | null
  additionalHeaders?: Record<string, string>
}

/**
 * Unified header builder using composition
 * Follows Open/Closed Principle - extensible without modification
 */
export function buildHeaders(options: HeaderBuilderOptions = {}): HeadersInit {
  const { contentType, token, additionalHeaders = {} } = options
  
  const headers: HeadersInit = { ...additionalHeaders }
  
  // Only add Content-Type if specified (not null)
  if (contentType !== null && contentType !== undefined) {
    headers['Content-Type'] = contentType
  }
  
  // Add authorization if token provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

// Convenience functions using composition (DRY)
export function buildAuthHeaders(options: Omit<HeaderBuilderOptions, 'contentType'> & { contentType?: string } = {}): HeadersInit {
  return buildHeaders({ contentType: 'application/json', ...options })
}

export function buildJsonHeaders(additionalHeaders?: Record<string, string>): HeadersInit {
  return buildHeaders({ contentType: 'application/json', additionalHeaders })
}

export function buildUploadHeaders(additionalHeaders?: Record<string, string>): HeadersInit {
  return buildHeaders({ contentType: null, additionalHeaders })  // null = omit Content-Type
}
```

**Benefits:**
- ✅ Eliminates DRY violations
- ✅ Single source of truth for header building
- ✅ Follows Open/Closed Principle
- ✅ Easier to test (one function vs three)
- ✅ Better mutation test coverage

---

## 2. useAuthenticatedApi.ts (46.15% mutation score) - **CRITICAL**

### Current Issues

#### Massive DRY Violations
- **~400 lines of duplicated error handling code** across 4 methods (POST, GET, PUT, DELETE)
- Each method has identical:
  - Client validation logic (~40 lines each)
  - URL validation logic (~40 lines each)
  - Error creation patterns (~30 lines each)
  - Promise rejection handling (~20 lines each)

#### SOLID Violations
- **Single Responsibility**: Each method handles validation, error creation, header building, and request execution
- **DRY**: Error handling code repeated 4 times
- **Open/Closed**: Adding new HTTP methods requires duplicating all error handling

#### Code Smells
- Excessive defensive programming (mutation-resistant code) creates unmaintainable complexity
- Nested try-catch blocks (3-4 levels deep)
- Mutation-resistant code adds ~300 lines of boilerplate

### Recommendations

#### Extract Common Request Handler (Strategy Pattern)

```typescript
// New file: hooks/utils/authenticatedRequestHandler.ts

interface RequestConfig {
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  additionalHeaders?: HeadersInit
}

interface RequestContext {
  client: HttpClient
  baseUrl: string
  token: string | null
}

/**
 * Validates request configuration
 * Single Responsibility: Only validates inputs
 */
function validateRequest(config: RequestConfig, context: RequestContext): Error | null {
  if (!context.client || typeof context.client[config.method.toLowerCase()] !== 'function') {
    return createSafeError(HTTP_CLIENT_ERROR_MSG, 'HttpClientError')
  }
  
  const url = `${context.baseUrl}${config.endpoint}`
  if (!url || url.trim() === '') {
    return createSafeError(URL_EMPTY_ERROR_MSG, 'InvalidUrlError')
  }
  
  return null
}

/**
 * Builds headers for authenticated request
 * Single Responsibility: Only builds headers
 */
function buildRequestHeaders(
  token: string | null,
  method: string,
  additionalHeaders?: HeadersInit
): HeadersInit {
  const headers: HeadersInit = { ...additionalHeaders }
  
  if (method === 'POST' || method === 'PUT') {
    headers['Content-Type'] = 'application/json'
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

/**
 * Executes authenticated HTTP request
 * Single Responsibility: Only executes requests
 * Open/Closed: Extensible for new HTTP methods
 */
function executeAuthenticatedRequest(
  config: RequestConfig,
  context: RequestContext
): Promise<any> {
  // Validate
  const validationError = validateRequest(config, context)
  if (validationError) {
    return Promise.reject(validationError)
  }
  
  // Build headers
  const headers = buildRequestHeaders(
    context.token,
    config.method,
    config.additionalHeaders
  )
  
  // Build URL
  const url = `${context.baseUrl}${config.endpoint}`
  
  // Execute request based on method (Strategy Pattern)
  const methodMap = {
    GET: () => context.client.get(url, headers),
    POST: () => context.client.post(url, config.data, headers),
    PUT: () => context.client.put(url, config.data, headers),
    DELETE: () => context.client.delete(url, headers),
  }
  
  return methodMap[config.method]()
}
```

#### Refactored Hook (Clean and DRY)

```typescript
// Refactored useAuthenticatedApi.ts (reduced from 500 to ~100 lines)

export function useAuthenticatedApi(
  httpClient?: HttpClient,
  apiBaseUrl?: string
) {
  try {
    const { token } = useAuth()
    const client = httpClient || defaultAdapters.createHttpClient()
    const baseUrl = apiBaseUrl || API_CONFIG.BASE_URL
    
    const context: RequestContext = { client, baseUrl, token }
    
    const authenticatedPost = useCallback(
      async (endpoint: string, data: any, additionalHeaders?: HeadersInit) => {
        return executeAuthenticatedRequest(
          { endpoint, method: 'POST', data, additionalHeaders },
          context
        )
      },
      [token, client, baseUrl]
    )
    
    const authenticatedGet = useCallback(
      async (endpoint: string, additionalHeaders?: HeadersInit) => {
        return executeAuthenticatedRequest(
          { endpoint, method: 'GET', additionalHeaders },
          context
        )
      },
      [token, client, baseUrl]
    )
    
    const authenticatedPut = useCallback(
      async (endpoint: string, data: any, additionalHeaders?: HeadersInit) => {
        return executeAuthenticatedRequest(
          { endpoint, method: 'PUT', data, additionalHeaders },
          context
        )
      },
      [token, client, baseUrl]
    )
    
    const authenticatedDelete = useCallback(
      async (endpoint: string, additionalHeaders?: HeadersInit) => {
        return executeAuthenticatedRequest(
          { endpoint, method: 'DELETE', additionalHeaders },
          context
        )
      },
      [token, client, baseUrl]
    )
    
    return {
      authenticatedPost,
      authenticatedGet,
      authenticatedPut,
      authenticatedDelete,
    }
  } catch (error) {
    // Simplified fallback
    const safeError = createSafeError('Hook initialization failed', 'HookInitError')
    const rejectFn = () => Promise.reject(safeError)
    return {
      authenticatedPost: rejectFn,
      authenticatedGet: rejectFn,
      authenticatedPut: rejectFn,
      authenticatedDelete: rejectFn,
    }
  }
}
```

**Benefits:**
- ✅ **Eliminates ~400 lines of duplicated code**
- ✅ **Single Responsibility**: Each function has one job
- ✅ **DRY**: Error handling in one place
- ✅ **Open/Closed**: Easy to add new HTTP methods
- ✅ **Testability**: Each function can be tested independently
- ✅ **Maintainability**: Changes in one place affect all methods
- ✅ **Better mutation coverage**: Less code = fewer mutants

**Estimated Impact:**
- Code reduction: ~400 lines → ~150 lines (62% reduction)
- Mutation score improvement: 46% → ~75%+ (estimated)
- Test coverage improvement: Easier to test isolated functions

---

## 3. useWebSocket.ts (49.40% mutation score)

### Current Issues

#### DRY Violations
- Connection skip logic duplicated in `connect()` and `useEffect`
- Status checking logic repeated multiple times
- Logging patterns duplicated

#### SOLID Violations
- **Single Responsibility**: Hook manages connection, reconnection, status tracking, and cleanup
- **Separation of Concerns**: Business logic mixed with React lifecycle

### Recommendations

#### Extract Connection Manager Class

```typescript
// New file: hooks/utils/WebSocketConnectionManager.ts

class WebSocketConnectionManager {
  private ws: WebSocket | null = null
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  
  constructor(
    private config: {
      maxReconnectAttempts: number
      webSocketFactory: WebSocketFactory
      windowLocation: WindowLocation | null
      logger: typeof logger
    }
  ) {}
  
  connect(
    executionId: string,
    executionStatus: ExecutionStatus | undefined,
    callbacks: WebSocketCallbacks
  ): void {
    if (shouldSkipConnection(executionId, executionStatus)) {
      return
    }
    
    this.close()
    const wsUrl = buildWebSocketUrl(executionId, this.config.windowLocation)
    // ... connection logic
  }
  
  close(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
  
  // ... other methods
}
```

#### Simplified Hook

```typescript
export function useWebSocket(options: UseWebSocketOptions) {
  const managerRef = useRef<WebSocketConnectionManager | null>(null)
  
  // Initialize manager once
  if (!managerRef.current) {
    managerRef.current = new WebSocketConnectionManager({
      maxReconnectAttempts: 5,
      webSocketFactory: options.webSocketFactory || defaultAdapters.createWebSocketFactory(),
      windowLocation: options.windowLocation || defaultAdapters.createWindowLocation(),
      logger: options.logger || logger
    })
  }
  
  useEffect(() => {
    if (options.executionId) {
      managerRef.current?.connect(options.executionId, options.executionStatus, {
        onLog: options.onLog,
        onStatus: options.onStatus,
        // ... other callbacks
      })
    } else {
      managerRef.current?.close()
    }
    
    return () => managerRef.current?.close()
  }, [options.executionId, options.executionStatus])
  
  return { isConnected: managerRef.current.isConnected }
}
```

**Benefits:**
- ✅ Separates connection logic from React lifecycle
- ✅ Single Responsibility: Manager handles WebSocket, Hook handles React
- ✅ DRY: Connection logic in one place
- ✅ Testability: Manager can be tested independently
- ✅ Reusability: Manager can be used outside React

---

## 4. nodePositioning.ts (31.75% mutation score)

### Current Issues

#### DRY Violations
- Position calculation logic duplicated across functions
- Default options merging repeated
- Max position calculation duplicated

#### Missing Abstractions
- No base class or strategy pattern for different positioning algorithms
- Hard to extend with new positioning strategies

### Recommendations

#### Strategy Pattern for Positioning

```typescript
// Strategy interface
interface PositioningStrategy {
  calculatePositions(
    existingNodes: Node[],
    count: number,
    options: NodePositioningOptions
  ): Position[]
}

// Concrete strategies
class HorizontalStrategy implements PositioningStrategy {
  calculatePositions(existingNodes: Node[], count: number, options: NodePositioningOptions): Position[] {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    if (existingNodes.length === 0) {
      return Array.from({ length: count }, (_, i) => ({
        x: opts.defaultX + (i * opts.horizontalSpacing),
        y: opts.defaultY
      }))
    }
    const maxX = getMaxNodeX(existingNodes)
    return Array.from({ length: count }, (_, i) => ({
      x: maxX + opts.horizontalSpacing + (i * opts.horizontalSpacing),
      y: opts.defaultY
    }))
  }
}

class VerticalStrategy implements PositioningStrategy {
  // ... implementation
}

class GridStrategy implements PositioningStrategy {
  // ... implementation
}

// Factory function
export function calculateNodePositions(
  strategy: 'horizontal' | 'vertical' | 'grid',
  existingNodes: Node[],
  count: number,
  options: NodePositioningOptions = {}
): Position[] {
  const strategies: Record<string, PositioningStrategy> = {
    horizontal: new HorizontalStrategy(),
    vertical: new VerticalStrategy(),
    grid: new GridStrategy()
  }
  
  return strategies[strategy].calculatePositions(existingNodes, count, options)
}

// Convenience functions (backward compatible)
export function calculateNextNodePosition(...) {
  return calculateNodePositions('horizontal', existingNodes, 1, options)[0]
}

export function calculateMultipleNodePositions(...) {
  return calculateNodePositions('vertical', existingNodes, count, options)
}

export function calculateGridPosition(...) {
  return calculateNodePositions('grid', existingNodes, count, { ...options, columnsPerRow })
}
```

**Benefits:**
- ✅ Open/Closed: Easy to add new positioning strategies
- ✅ Single Responsibility: Each strategy handles one positioning type
- ✅ DRY: Common logic extracted
- ✅ Testability: Each strategy testable independently

---

## 5. formUtils.ts (31.11% mutation score)

### Current Issues

#### Missing Robustness
- No validation of path format
- No handling of array indices in paths
- No type safety for nested operations

#### DRY Violations
- Path parsing logic duplicated (`Array.isArray(path) ? path : path.split('.')`)

### Recommendations

#### Enhanced with Path Parser

```typescript
// Path parser utility (DRY)
class PathParser {
  static parse(path: string | string[]): string[] {
    return Array.isArray(path) ? path : path.split('.').filter(Boolean)
  }
  
  static validate(path: string | string[]): boolean {
    const keys = this.parse(path)
    return keys.length > 0 && keys.every(key => key.length > 0)
  }
}

// Enhanced with better error handling
export function getNestedValue<T = any>(
  obj: any,
  path: string | string[],
  defaultValue?: T
): T | undefined {
  if (!obj || !path) return defaultValue
  
  const keys = PathParser.parse(path)
  if (keys.length === 0) return defaultValue
  
  let value = obj
  for (const key of keys) {
    if (value === null || value === undefined) {
      return defaultValue
    }
    value = value[key]
  }
  
  return value as T
}

export function setNestedValue<T extends Record<string, any>>(
  obj: T,
  path: string | string[],
  value: any
): T {
  if (!obj || !path || !PathParser.validate(path)) {
    return obj
  }
  
  const keys = PathParser.parse(path)
  const result = { ...obj } as any
  let current = result
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (current[key] === null || current[key] === undefined) {
      current[key] = {}
    } else if (typeof current[key] === 'object') {
      current[key] = { ...current[key] }
    } else {
      // Invalid path - intermediate value is not an object
      return obj
    }
    current = current[key]
  }
  
  current[keys[keys.length - 1]] = value
  return result as T
}
```

**Benefits:**
- ✅ DRY: Path parsing in one place
- ✅ Better error handling
- ✅ Type safety improvements
- ✅ More robust validation

---

## Implementation Priority

### Phase 1: Critical (High Impact)
1. **useAuthenticatedApi.ts** - Eliminates 400+ lines of duplication
   - Estimated improvement: 46% → 75%+ mutation score
   - Time: 4-6 hours
   - Risk: Medium (needs thorough testing)

### Phase 2: High Value
2. **apiUtils.ts** - Simple refactor, high test coverage improvement
   - Estimated improvement: 41% → 70%+ mutation score
   - Time: 1-2 hours
   - Risk: Low

3. **useWebSocket.ts** - Improves maintainability
   - Estimated improvement: 49% → 70%+ mutation score
   - Time: 3-4 hours
   - Risk: Medium

### Phase 3: Nice to Have
4. **nodePositioning.ts** - Good for extensibility
   - Estimated improvement: 32% → 60%+ mutation score
   - Time: 2-3 hours
   - Risk: Low

5. **formUtils.ts** - Incremental improvement
   - Estimated improvement: 31% → 55%+ mutation score
   - Time: 1 hour
   - Risk: Low

---

## Expected Overall Impact

**Before:**
- Average mutation score: ~40%
- Code duplication: High
- Maintainability: Low

**After:**
- Average mutation score: ~70%+
- Code duplication: Minimal
- Maintainability: High
- Code reduction: ~500+ lines eliminated

---

## Testing Strategy

For each refactored file:
1. **Unit tests** for extracted utilities
2. **Integration tests** for hook behavior
3. **Mutation tests** to verify improvements
4. **Regression tests** to ensure backward compatibility

---

## Conclusion

The primary issue is **massive DRY violations** in `useAuthenticatedApi.ts`, which accounts for most of the low mutation scores. By extracting common patterns and following SOLID principles, we can:

- Reduce code by ~500 lines
- Improve mutation scores from ~40% to ~70%+
- Improve maintainability and testability
- Make the codebase more extensible

The refactoring follows established design patterns (Strategy, Factory, Composition) and maintains backward compatibility while significantly improving code quality.
