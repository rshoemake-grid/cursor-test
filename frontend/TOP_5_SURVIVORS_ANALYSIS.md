# Top 5 Files with Most Survived Mutants - Refactoring Analysis

## Executive Summary

This document analyzes the top 5 files with the most survived mutants from mutation testing, identifies SOLID and DRY violations, and provides detailed refactoring recommendations.

**Mutation Test Results:** 83.17% overall score (83.98% for covered code)

---

## Top 5 Files by Survived Mutants

| Rank | File | Survived | Killed | Score | Total Mutants |
|------|------|----------|--------|-------|---------------|
| 1 | `WebSocketConnectionManager.ts` | 49 | 91 | 59.09% | 140 |
| 2 | `useExecutionPolling.ts` | 31 | 76 | 71.03% | 107 |
| 3 | `InputNodeEditor.tsx` | 31 | 201 | 86.64% | 232 |
| 4 | `ConditionNodeEditor.tsx` | 31 | 55 | 63.95% | 86 |
| 5 | `useMarketplaceIntegration.ts` | 30 | 74 | 71.15% | 104 |

**Total Survived:** 172 mutants across these 5 files (16.7% of all 1,032 survived mutants)

---

## 1. WebSocketConnectionManager.ts
**49 Survived Mutants | 59.09% Score**

### Current State
- **Location:** `frontend/src/hooks/utils/WebSocketConnectionManager.ts`
- **Type:** Class-based manager (separated from React lifecycle)
- **Purpose:** Manages WebSocket connection lifecycle, reconnection logic, and event handling

### SOLID Violations

#### ❌ Single Responsibility Principle (SRP)
**Multiple Responsibilities:**
1. Connection establishment
2. Event handler setup (`onopen`, `onmessage`, `onerror`, `onclose`)
3. Reconnection logic with exponential backoff
4. Status tracking and updates
5. Error handling and logging
6. Skip condition evaluation
7. URL building (delegated but still involved)

**Recommendation:** Split into focused classes:
- `WebSocketConnector` - Connection establishment only
- `WebSocketEventHandler` - Event handling only
- `WebSocketReconnector` - Reconnection logic only
- `WebSocketStateManager` - State tracking only

#### ⚠️ Open/Closed Principle (OCP)
- Reconnection strategy is hard-coded (exponential backoff)
- No extensibility for different reconnection strategies
- Event handler logic is tightly coupled

**Recommendation:** Use strategy pattern for reconnection:
```typescript
interface ReconnectionStrategy {
  calculateDelay(attempt: number, baseDelay: number): number
  shouldReconnect(attempt: number, maxAttempts: number): boolean
}
```

#### ⚠️ DRY Violations
- Multiple `logicalOr` calls for status checking
- Duplicate null/undefined checks for `reconnectTimeout`
- Repeated connection state checks (`this.ws !== null`, `this.isConnectedState`)

**Recommendation:** Extract validation utilities:
```typescript
// utils/websocketValidation.ts
export function isValidWebSocket(ws: WebSocket | null): ws is WebSocket {
  return ws !== null && ws.readyState === WebSocket.OPEN
}

export function hasPendingReconnection(timeout: ReturnType<typeof setTimeout> | null): boolean {
  return timeout !== null && timeout !== undefined
}
```

### Mutation Survivor Patterns

1. **Conditional Expressions (15+ survived)**
   - `status && isExecutionTerminated(status)` - Mutations survive
   - `this.ws !== null` checks
   - `event.wasClean && event.code === 1000` - Complex conditions

2. **Logical Operators (10+ survived)**
   - `logicalOr(status, this.lastKnownStatus)` - OR operator mutations
   - Multiple `&&` chains in skip conditions

3. **Mathematical Operations (8+ survived)**
   - `calculateReconnectDelay(attempt, 10000)` - Delay calculations
   - Exponential backoff formula mutations

4. **String Literals (5+ survived)**
   - WebSocket close codes (`1000`, `'Execution completed'`)
   - Status strings (`'connected'`, `'disconnected'`, `'error'`)

5. **Optional Chaining (5+ survived)**
   - `callbacks.onStatus?.('connected')` - Optional chaining mutations
   - `callbacks.onError?.()` patterns

### Refactoring Recommendations

#### High Priority

1. **Extract Reconnection Strategy**
   ```typescript
   // utils/websocketReconnectionStrategy.ts
   export class ExponentialBackoffStrategy implements ReconnectionStrategy {
     calculateDelay(attempt: number, baseDelay: number): number {
       const delay = baseDelay * Math.pow(2, attempt - 1)
       return Math.min(delay, 60000) // Cap at 60s
     }
     
     shouldReconnect(attempt: number, maxAttempts: number): boolean {
       return attempt < maxAttempts
     }
   }
   ```

2. **Extract Event Handler Setup**
   ```typescript
   // utils/websocketEventHandlers.ts
   export function createWebSocketEventHandlers(
     ws: WebSocket,
     callbacks: WebSocketCallbacks,
     logger: Logger
   ): WebSocketEventHandlers {
     return {
       onopen: () => { /* ... */ },
       onmessage: (event) => { /* ... */ },
       onerror: (error) => { /* ... */ },
       onclose: (event) => { /* ... */ }
     }
   }
   ```

3. **Extract Validation Functions**
   ```typescript
   // utils/websocketValidation.ts
   export function shouldSkipConnection(
     executionId: string | null,
     status: ExecutionStatus | undefined,
     lastStatus: ExecutionStatus | undefined
   ): boolean {
     if (isTemporaryExecutionId(executionId)) return true
     const currentStatus = logicalOr(status, lastStatus)
     return currentStatus === 'completed' || currentStatus === 'failed'
   }
   ```

4. **Use Constants for Magic Values**
   ```typescript
   // constants/websocketConstants.ts
   export const WS_CLOSE_CODES = {
     NORMAL_CLOSURE: 1000,
     MAX_RECONNECT_DELAY: 60000,
     BASE_RECONNECT_DELAY: 10000
   } as const
   ```

#### Medium Priority

5. **Extract Connection State Management**
   ```typescript
   class WebSocketStateManager {
     private isConnected = false
     private ws: WebSocket | null = null
     
     setConnected(ws: WebSocket): void { /* ... */ }
     setDisconnected(): void { /* ... */ }
     get isOpen(): boolean { /* ... */ }
   }
   ```

6. **Improve Error Handling**
   - Extract error message formatting
   - Use error types instead of string messages
   - Centralize error logging

### Expected Impact
- **Survived Reduction:** 49 → ~15-20 (60-70% reduction)
- **Score Improvement:** 59.09% → ~85-90%
- **Mutation Resistance:** +30-35% improvement

---

## 2. useExecutionPolling.ts
**31 Survived Mutants | 71.03% Score**

### Current State
- **Location:** `frontend/src/hooks/utils/useExecutionPolling.ts`
- **Type:** React hook
- **Purpose:** Polls execution updates as fallback when WebSocket unavailable

### SOLID Violations

#### ❌ Single Responsibility Principle (SRP)
**Multiple Responsibilities:**
1. Polling interval management
2. Execution filtering (running executions only)
3. API call batching (Promise.all)
4. Status transformation (`completed` → `completed`, `paused` → `running`)
5. State updates (setTabs)
6. Error handling and logging
7. Iteration counting (MAX_ITERATIONS guard)

**Recommendation:** Split into:
- `usePollingInterval` - Interval management only
- `useExecutionFiltering` - Filter running executions
- `useExecutionStatusSync` - Status synchronization
- `ExecutionPollingService` - Core polling logic (extracted from hook)

#### ⚠️ DRY Violations
- Multiple `logicalOr` calls for default values
- Duplicate null/undefined checks for tabs and executions
- Repeated array validation patterns
- Status transformation logic duplicated

**Recommendation:** Extract utilities:
```typescript
// utils/executionFiltering.ts
export function filterRunningExecutions(
  tabs: Tab[],
  validator: (id: string) => boolean
): Execution[] {
  return tabs
    .flatMap(tab => tab.executions || [])
    .filter(e => 
      e !== null && 
      e !== undefined &&
      e.id !== null && 
      e.id !== undefined &&
      e.status === 'running' && 
      validator(e.id)
    )
}

// utils/executionStatusTransform.ts
export function transformExecutionStatus(
  status: string
): 'completed' | 'failed' | 'running' {
  if (status === 'completed') return 'completed'
  if (status === 'failed') return 'failed'
  if (status === 'paused') return 'running' // Keep as running if paused
  return 'running'
}
```

### Mutation Survivor Patterns

1. **Conditional Expressions (12+ survived)**
   - `exec.status !== newStatus` - Status comparison mutations
   - `execution.status === 'completed' ? 'completed' : ...` - Ternary chains
   - `runningExecutions.length === 0` - Length checks

2. **Logical Operators (8+ survived)**
   - `logicalOr(update, exec)` - OR operator mutations
   - `tab.executions && Array.isArray(tab.executions)` - AND chains

3. **Mathematical Operations (5+ survived)**
   - `iterationCount++` - Increment mutations
   - `runningExecutions.length > 50` - Comparison mutations

4. **String Literals (4+ survived)**
   - Status strings (`'completed'`, `'failed'`, `'running'`, `'paused'`)
   - Error messages

5. **Optional Chaining (2+ survived)**
   - `execution.completed_at` - Property access

### Refactoring Recommendations

#### High Priority

1. **Extract Execution Filtering Service**
   ```typescript
   // utils/executionFilteringService.ts
   export class ExecutionFilteringService {
     filterRunningExecutions(
       tabs: Tab[],
       validator: ExecutionIdValidator
     ): Execution[] {
       // Centralized filtering logic with explicit checks
     }
     
     limitConcurrentExecutions(
       executions: Execution[],
       max: number = 50
     ): Execution[] {
       // Limit logic
     }
   }
   ```

2. **Extract Status Transformation**
   ```typescript
   // utils/executionStatusTransform.ts
   export const EXECUTION_STATUSES = {
     COMPLETED: 'completed',
     FAILED: 'failed',
     RUNNING: 'running',
     PAUSED: 'paused'
   } as const
   
   export function normalizeExecutionStatus(
     status: string
   ): 'completed' | 'failed' | 'running' {
     if (status === EXECUTION_STATUSES.COMPLETED) {
       return EXECUTION_STATUSES.COMPLETED
     }
     if (status === EXECUTION_STATUSES.FAILED) {
       return EXECUTION_STATUSES.FAILED
     }
     // Paused maps to running
     return EXECUTION_STATUSES.RUNNING
   }
   ```

3. **Extract Polling Service**
   ```typescript
   // services/executionPollingService.ts
   export class ExecutionPollingService {
     async pollExecutions(
       executions: Execution[],
       apiClient: WorkflowAPIClient
     ): Promise<ExecutionUpdate[]> {
       // Core polling logic extracted from hook
     }
   }
   ```

4. **Use Constants for Magic Numbers**
   ```typescript
   // constants/pollingConstants.ts
   export const POLLING_CONSTANTS = {
     DEFAULT_INTERVAL: 2000,
     MIN_INTERVAL: 1,
     MAX_INTERVAL: 60000,
     MAX_ITERATIONS: 1000,
     MAX_CONCURRENT_EXECUTIONS: 50
   } as const
   ```

#### Medium Priority

5. **Extract State Update Logic**
   ```typescript
   // utils/executionStateUpdater.ts
   export function updateTabsWithExecutionResults(
     tabs: Tab[],
     updates: ExecutionUpdate[]
   ): Tab[] {
     return tabs.map(tab => ({
       ...tab,
       executions: updateTabExecutions(tab.executions, updates)
     }))
   }
   ```

### Expected Impact
- **Survived Reduction:** 31 → ~8-12 (60-70% reduction)
- **Score Improvement:** 71.03% → ~88-92%
- **Mutation Resistance:** +20-25% improvement

---

## 3. InputNodeEditor.tsx
**31 Survived Mutants | 86.64% Score**

### Current State
- **Location:** `frontend/src/components/editors/InputNodeEditor.tsx`
- **Type:** React component
- **Purpose:** Handles editing of multiple input node types (GCP Bucket, AWS S3, Pub/Sub, Local FileSystem, Database, Firebase, BigQuery)

### SOLID Violations

#### ❌ Single Responsibility Principle (SRP)
**Multiple Responsibilities:**
1. **7 different node type editors** in one component
2. Form state management (12+ state variables)
3. Input synchronization with node data
4. Active element tracking (prevent overwriting user input)
5. Default value handling (`|| ''`, `|| 'us-east-1'`, etc.)
6. Config update propagation

**Recommendation:** Split into type-specific editors:
- `GCPBucketEditor.tsx`
- `AWSS3Editor.tsx`
- `GCPPubSubEditor.tsx`
- `LocalFileSystemEditor.tsx`
- `DatabaseEditor.tsx`
- `FirebaseEditor.tsx`
- `BigQueryEditor.tsx`
- Shared: `InputEditorBase.tsx` - Common logic

#### ❌ DRY Violations
- **Massive duplication:** 12+ nearly identical `useEffect` sync patterns
- **Repeated patterns:**
  ```typescript
  if (document.activeElement !== fieldRef.current) {
    setFieldValue(inputConfig.field || defaultValue)
  }
  ```
- **Duplicate default values:** `'us-east-1'`, `'read'`, `''` repeated
- **Repeated logical OR patterns:** `inputConfig.field || ''`

**Recommendation:** Extract shared utilities:
```typescript
// hooks/useInputFieldSync.ts
export function useInputFieldSync<T>(
  ref: RefObject<HTMLElement>,
  configValue: T | null | undefined,
  defaultValue: T
): [T, (value: T) => void] {
  const [value, setValue] = useState(defaultValue)
  
  useEffect(() => {
    if (document.activeElement !== ref.current) {
      setValue(configValue ?? defaultValue)
    }
  }, [configValue, defaultValue, ref])
  
  return [value, setValue]
}

// utils/inputDefaults.ts
export const INPUT_DEFAULTS = {
  REGION: 'us-east-1',
  MODE: 'read',
  EMPTY_STRING: ''
} as const
```

### Mutation Survivor Patterns

1. **Logical OR Operators (20+ survived)**
   - `inputConfig.bucket_name || ''` - OR operator mutations
   - `inputConfig.region || 'us-east-1'` - Default value mutations
   - `inputConfig.mode || 'read'` - Mode default mutations
   - Pattern repeated 12+ times

2. **Conditional Expressions (6+ survived)**
   - `document.activeElement !== fieldRef.current` - Active element checks
   - `node.type === 'gcp_bucket'` - Type checks

3. **String Literals (3+ survived)**
   - Default values (`'us-east-1'`, `'read'`, `''`)
   - Placeholder text

4. **Optional Chaining (2+ survived)**
   - `inputConfig.field` - Property access

### Refactoring Recommendations

#### High Priority

1. **Split into Type-Specific Editors**
   ```typescript
   // components/editors/input/GCPBucketEditor.tsx
   export function GCPBucketEditor({ node, onConfigUpdate }: Props) {
     const bucketName = useInputFieldSync(
       bucketNameRef,
       node.data.input_config?.bucket_name,
       ''
     )
     // ... type-specific fields only
   }
   
   // components/editors/input/InputNodeEditor.tsx (router)
   export default function InputNodeEditor({ node, onConfigUpdate }: Props) {
     switch (node.type) {
       case 'gcp_bucket': return <GCPBucketEditor node={node} onConfigUpdate={onConfigUpdate} />
       case 'aws_s3': return <AWSS3Editor node={node} onConfigUpdate={onConfigUpdate} />
       // ... etc
     }
   }
   ```

2. **Extract Field Sync Hook**
   ```typescript
   // hooks/useInputFieldSync.ts
   export function useInputFieldSync<T>(
     ref: RefObject<HTMLElement>,
     configValue: T | null | undefined,
     defaultValue: T
   ): [T, (value: T) => void] {
     // Centralized sync logic
   }
   ```

3. **Extract Default Values**
   ```typescript
   // constants/inputDefaults.ts
   export const INPUT_DEFAULTS = {
     REGION: 'us-east-1',
     MODE_READ: 'read',
     MODE_WRITE: 'write',
     EMPTY_STRING: ''
   } as const
   ```

4. **Extract Config Access Utilities**
   ```typescript
   // utils/inputConfigAccess.ts
   export function getInputConfigValue<T>(
     config: Record<string, any> | null | undefined,
     key: string,
     defaultValue: T
   ): T {
     if (config === null || config === undefined) {
       return defaultValue
     }
     const value = config[key]
     if (value === null || value === undefined || value === '') {
       return defaultValue
     }
     return value as T
   }
   ```

#### Medium Priority

5. **Create Shared Base Component**
   ```typescript
   // components/editors/input/InputEditorBase.tsx
   export function InputEditorBase({ children, title }: Props) {
     return (
       <div className="border-t pt-4">
         <h4 className="text-sm font-semibold text-gray-900 mb-3">{title}</h4>
         {children}
       </div>
     )
   }
   ```

### Expected Impact
- **Survived Reduction:** 31 → ~8-10 (65-75% reduction)
- **Score Improvement:** 86.64% → ~95-97%
- **Mutation Resistance:** +10-15% improvement

---

## 4. ConditionNodeEditor.tsx
**31 Survived Mutants | 63.95% Score**

### Current State
- **Location:** `frontend/src/components/editors/ConditionNodeEditor.tsx`
- **Type:** React component
- **Purpose:** Handles editing of condition node properties (field, value, condition type)

### SOLID Violations

#### ⚠️ Single Responsibility Principle (SRP)
**Responsibilities:**
1. Condition type selection
2. Field input management
3. Value input management (conditional)
4. Config synchronization
5. Active element tracking
6. Default value handling

**Status:** Mostly compliant, but could extract field/value management

#### ❌ DRY Violations
- **Repeated null/undefined checks:**
  ```typescript
  const conditionConfig = (node.data.condition_config !== null && 
                           node.data.condition_config !== undefined)
    ? node.data.condition_config
    : {}
  ```
  Pattern repeated 3+ times

- **Repeated field validation:**
  ```typescript
  const fieldValue = (conditionConfig.field !== null && 
                     conditionConfig.field !== undefined && 
                     conditionConfig.field !== '')
    ? conditionConfig.field
    : ''
  ```
  Same pattern for `value`

**Recommendation:** Extract utilities:
```typescript
// utils/conditionConfigAccess.ts
export function getConditionConfig(
  nodeData: NodeData
): ConditionConfig {
  if (nodeData.condition_config === null || 
      nodeData.condition_config === undefined) {
    return {}
  }
  return nodeData.condition_config
}

export function getConditionField(
  config: ConditionConfig,
  defaultValue: string = ''
): string {
  if (config.field === null || 
      config.field === undefined || 
      config.field === '') {
    return defaultValue
  }
  return config.field
}
```

### Mutation Survivor Patterns

1. **Conditional Expressions (15+ survived)**
   - `conditionConfig.field !== null && conditionConfig.field !== undefined && conditionConfig.field !== ''` - Complex null checks
   - `conditionType !== CONDITION_TYPES.EMPTY && conditionType !== CONDITION_TYPES.NOT_EMPTY` - Type checks
   - `showValueField` conditional rendering

2. **Logical Operators (8+ survived)**
   - Multiple `&&` chains in validation
   - `isValidConditionType(conditionConfig.condition_type)` - Validation mutations

3. **String Literals (5+ survived)**
   - Condition type constants (already using constants - good!)
   - Default empty string `''`

4. **Optional Chaining (3+ survived)**
   - `node.data.condition_config` - Property access

### Refactoring Recommendations

#### High Priority

1. **Extract Config Access Utilities**
   ```typescript
   // utils/conditionConfigAccess.ts
   export function getConditionConfig(
     nodeData: NodeData
   ): ConditionConfig {
     // Centralized null/undefined check
   }
   
   export function getConditionFieldValue(
     config: ConditionConfig
   ): string {
     // Centralized field extraction
   }
   
   export function getConditionValueValue(
     config: ConditionConfig
   ): string {
     // Centralized value extraction
   }
   ```

2. **Extract Field Sync Hook** (shared with InputNodeEditor)
   ```typescript
   // hooks/useInputFieldSync.ts (reuse from InputNodeEditor refactoring)
   ```

3. **Extract Condition Type Logic**
   ```typescript
   // utils/conditionTypeUtils.ts
   export function getConditionType(
     config: ConditionConfig
   ): ConditionType {
     if (config.condition_type === null || 
         config.condition_type === undefined || 
         config.condition_type === '' || 
         !isValidConditionType(config.condition_type)) {
       return CONDITION_TYPES.EQUALS
     }
     return config.condition_type
   }
   
   export function shouldShowValueField(
     conditionType: ConditionType
   ): boolean {
     return conditionType !== CONDITION_TYPES.EMPTY && 
            conditionType !== CONDITION_TYPES.NOT_EMPTY
   }
   ```

#### Medium Priority

4. **Simplify Component Logic**
   - Use extracted utilities
   - Reduce inline conditional logic
   - Extract render logic for value field

### Expected Impact
- **Survived Reduction:** 31 → ~10-12 (60-65% reduction)
- **Score Improvement:** 63.95% → ~85-90%
- **Mutation Resistance:** +20-25% improvement

---

## 5. useMarketplaceIntegration.ts
**30 Survived Mutants | 71.15% Score**

### Current State
- **Location:** `frontend/src/hooks/marketplace/useMarketplaceIntegration.ts`
- **Type:** React hook
- **Purpose:** Handles adding agents from marketplace to workflow canvas

### SOLID Violations

#### ❌ Single Responsibility Principle (SRP)
**Multiple Responsibilities:**
1. Agent-to-node conversion
2. Node positioning calculation
3. Draft storage updates
4. Event listening (CustomEvent)
5. Storage polling (setInterval for pending agents)
6. Tab ID matching logic
7. Timestamp validation (10 second window)
8. State synchronization

**Recommendation:** Split into:
- `useAgentToNodeConverter` - Conversion logic only
- `useDraftStorageSync` - Storage synchronization
- `usePendingAgentsListener` - Event/storage listening
- `useNodePositioning` - Positioning logic (already extracted but could be improved)

#### ❌ DRY Violations
- **Multiple `setTimeout` calls** (lines 82, 98) - Should use debounce utility
- **Repeated `logicalOr` chains:**
  ```typescript
  logicalOr(agent.name, logicalOr(agent.label, 'Agent Node'))
  ```
- **Duplicate null/undefined checks:**
  - `currentDraft?.edges` - Optional chaining
  - `pending.tabId !== tabId` - Comparison patterns
  - `Date.now() - pending.timestamp < 10000` - Time calculations

**Recommendation:** Extract utilities:
```typescript
// utils/agentNodeConversion.ts
export function convertAgentToNode(
  agent: AgentTemplate,
  position: Position,
  index: number
): Node {
  return {
    id: `agent-${Date.now()}-${index}`,
    type: 'agent',
    position,
    draggable: true,
    data: {
      label: getAgentLabel(agent),
      name: getAgentName(agent),
      description: getAgentDescription(agent),
      agent_config: getAgentConfig(agent)
    }
  }
}

export function getAgentLabel(agent: AgentTemplate): string {
  if (agent.name !== null && agent.name !== undefined && agent.name !== '') {
    return agent.name
  }
  if (agent.label !== null && agent.label !== undefined && agent.label !== '') {
    return agent.label
  }
  return 'Agent Node'
}

// utils/pendingAgentsValidation.ts
export function isPendingAgentsValid(
  pending: PendingAgents,
  currentTabId: string,
  maxAge: number = 10000
): boolean {
  if (pending.tabId !== currentTabId) {
    return false
  }
  const age = Date.now() - pending.timestamp
  if (age < 0 || age >= maxAge) {
    return false
  }
  return true
}
```

### Mutation Survivor Patterns

1. **Logical OR Operators (12+ survived)**
   - `agent.name || agent.label || 'Agent Node'` - OR chain mutations
   - `agent.description || ''` - OR operator mutations
   - `agent.agent_config || {}` - OR operator mutations
   - `currentDraft?.edges || []` - Optional chaining + OR

2. **Conditional Expressions (8+ survived)**
   - `pending.tabId === tabId && Date.now() - pending.timestamp < 10000` - Complex AND condition
   - `currentNodes.length > 0` - Length checks
   - `checkCount >= maxChecks` - Comparison mutations

3. **Mathematical Operations (5+ survived)**
   - `Date.now() - pending.timestamp` - Time calculations
   - `Date.now() - pending.timestamp < 10000` - Boundary checks
   - `currentY + (index * 150)` - Position calculations

4. **String Literals (3+ survived)**
   - `'Agent Node'` - Fallback label
   - `'pendingAgentsToAdd'` - Storage key

5. **setTimeout/setInterval (2+ survived)**
   - `setTimeout(() => { ... }, 0)` - Immediate execution
   - `setTimeout(() => { ... }, 1000)` - Delayed execution
   - `setInterval(() => { ... }, 1000)` - Polling interval

### Refactoring Recommendations

#### High Priority

1. **Extract Agent-to-Node Conversion**
   ```typescript
   // utils/agentNodeConversion.ts
   export class AgentNodeConverter {
     convert(agent: AgentTemplate, position: Position, index: number): Node {
       // Centralized conversion with explicit checks
     }
     
     private getLabel(agent: AgentTemplate): string {
       // Explicit null/undefined/empty checks
     }
     
     private getName(agent: AgentTemplate): string {
       // Explicit checks
     }
   }
   ```

2. **Extract Pending Agents Validation**
   ```typescript
   // utils/pendingAgentsValidation.ts
   export function validatePendingAgents(
     pending: PendingAgents | null,
     currentTabId: string,
     maxAge: number = 10000
   ): boolean {
     if (pending === null || pending === undefined) {
       return false
     }
     if (pending.tabId !== currentTabId) {
       return false
     }
     const age = Date.now() - pending.timestamp
     if (age < 0 || age >= maxAge) {
       return false
     }
     return true
   }
   ```

3. **Replace setTimeout with useDebounce/useCallback**
   ```typescript
   // Use extracted debounce utility instead of setTimeout
   const debouncedDraftUpdate = useDebounce(
     () => {
       // Draft update logic
     },
     100
   )
   ```

4. **Extract Storage Polling Logic**
   ```typescript
   // hooks/usePendingAgentsPolling.ts
   export function usePendingAgentsPolling(
     tabId: string,
     storage: StorageAdapter | null,
     onPendingFound: (agents: AgentTemplate[]) => void,
     maxChecks: number = 10
   ): void {
     // Centralized polling logic
   }
   ```

5. **Use Constants for Magic Values**
   ```typescript
   // constants/marketplaceConstants.ts
   export const MARKETPLACE_CONSTANTS = {
     PENDING_AGENTS_MAX_AGE: 10000, // 10 seconds
     PENDING_AGENTS_MAX_CHECKS: 10,
     PENDING_AGENTS_CHECK_INTERVAL: 1000, // 1 second
     AGENT_NODE_SPACING: 150,
     DEFAULT_AGENT_LABEL: 'Agent Node'
   } as const
   ```

#### Medium Priority

6. **Extract Event Handler**
   ```typescript
   // hooks/useMarketplaceEventHandling.ts
   export function useMarketplaceEventHandling(
     tabId: string,
     onAddAgents: (agents: AgentTemplate[]) => void
   ): void {
     // Event listener logic
   }
   ```

### Expected Impact
- **Survived Reduction:** 30 → ~8-10 (65-70% reduction)
- **Score Improvement:** 71.15% → ~88-92%
- **Mutation Resistance:** +20-25% improvement

---

## Summary of Recommendations

### Cross-Cutting Improvements

1. **Extract Common Patterns**
   - Create `useInputFieldSync` hook (shared by InputNodeEditor and ConditionNodeEditor)
   - Create `useDebounce` utility (replace setTimeout patterns)
   - Create validation utilities for null/undefined/empty checks

2. **Use Constants for Magic Values**
   - WebSocket close codes, delays, intervals
   - Default values (regions, modes, labels)
   - Timeout values, max iterations, limits

3. **Extract Strategy Patterns**
   - Reconnection strategies (WebSocketConnectionManager)
   - Status transformation strategies (useExecutionPolling)

4. **Improve Error Handling**
   - Centralized error formatting
   - Error types instead of strings
   - Consistent error logging

### Priority Ranking

1. **High Priority** (Immediate Impact):
   - WebSocketConnectionManager.ts - Extract reconnection strategy
   - useMarketplaceIntegration.ts - Extract agent conversion, replace setTimeout
   - InputNodeEditor.tsx - Split into type-specific editors

2. **Medium Priority** (Significant Impact):
   - useExecutionPolling.ts - Extract filtering and status transformation
   - ConditionNodeEditor.tsx - Extract config access utilities

3. **Low Priority** (Nice to Have):
   - Shared utilities for common patterns
   - Additional test coverage for edge cases

### Expected Overall Impact

| File | Current Score | Expected Score | Improvement |
|------|---------------|----------------|-------------|
| WebSocketConnectionManager.ts | 59.09% | 85-90% | +25-30% |
| useExecutionPolling.ts | 71.03% | 88-92% | +17-21% |
| InputNodeEditor.tsx | 86.64% | 95-97% | +8-10% |
| ConditionNodeEditor.tsx | 63.95% | 85-90% | +21-26% |
| useMarketplaceIntegration.ts | 71.15% | 88-92% | +17-21% |

**Total Survived Reduction:** 172 → ~50-60 (65-70% reduction)  
**Overall Score Impact:** +1.5% to +2.0% improvement to mutation score

---

## Implementation Plan

### Phase 1: High-Impact Refactorings (Week 1)
1. WebSocketConnectionManager.ts - Reconnection strategy extraction
2. useMarketplaceIntegration.ts - Agent conversion extraction
3. InputNodeEditor.tsx - Type-specific editor split

### Phase 2: Medium-Impact Refactorings (Week 2)
4. useExecutionPolling.ts - Filtering and status transformation
5. ConditionNodeEditor.tsx - Config access utilities

### Phase 3: Shared Utilities (Week 3)
6. Create shared hooks and utilities
7. Update all files to use shared utilities
8. Add comprehensive tests

### Phase 4: Verification (Week 4)
9. Re-run mutation testing
10. Verify improvements
11. Document results

---

## Conclusion

These 5 files account for **16.7% of all survived mutants**. By applying SOLID principles and DRY patterns, we can reduce survived mutants by **65-70%** in these files, improving the overall mutation score by **+1.5% to +2.0%**.

The refactoring will also improve:
- **Code maintainability** - Smaller, focused modules
- **Testability** - Easier to test individual responsibilities
- **Reusability** - Shared utilities can be used across codebase
- **Mutation resistance** - Explicit checks and constants reduce mutation survival
