# Additional Code Organization Recommendations for Hooks

## Overview

After completing Phase 1 and Phase 2 refactoring, there are still several opportunities for further code organization improvements in the hooks folder.

---

## Priority 1: Dependency Injection (DIP Compliance)

### Hooks Needing Dependency Injection

#### 1. `useTemplateOperations.ts` 🔴 HIGH PRIORITY
**Current Issues:**
- Directly imports `api`, `logger`, `showError`, `showSuccess`, `showConfirm`
- Hard to test with mocks
- Violates Dependency Inversion Principle

**Recommendation:**
```typescript
interface UseTemplateOperationsOptions {
  // ... existing options
  // Dependency injection
  apiClient?: WorkflowAPIClient
  logger?: typeof logger
  showErrorNotification?: typeof showError
  showSuccessNotification?: typeof showSuccess
  showConfirmDialog?: typeof showConfirm
}
```

**Impact:** High - This hook has 302 lines and multiple responsibilities

---

#### 2. `useTabRenaming.ts` 🟡 MEDIUM PRIORITY
**Current Issues:**
- Directly imports `showError`, `logger`
- Could benefit from dependency injection

**Recommendation:**
```typescript
interface UseTabRenamingOptions {
  tabs: WorkflowTabData[]
  onRename: (tabId: string, newName: string, previousName: string) => Promise<void> | void
  // Dependency injection
  showErrorNotification?: typeof showError
  logger?: typeof logger
}
```

**Impact:** Medium - Smaller hook, but still benefits from DI

---

#### 3. `useMarketplaceIntegration.ts` 🟡 MEDIUM PRIORITY
**Current Issues:**
- Directly imports `logger`
- Could benefit from dependency injection

**Recommendation:**
```typescript
interface UseMarketplaceIntegrationOptions {
  // ... existing options
  // Dependency injection
  logger?: typeof logger
}
```

**Impact:** Medium - Improves testability

---

#### 4. `useDraftManagement.ts` 🟡 MEDIUM PRIORITY
**Current Issues:**
- Directly imports `logger`
- Could benefit from dependency injection

**Recommendation:**
```typescript
interface UseDraftManagementOptions {
  // ... existing options
  // Dependency injection
  logger?: typeof logger
}
```

**Impact:** Medium - Improves testability

---

## Priority 2: Extract Common Utilities

### 1. Form Field Utilities 🔴 HIGH PRIORITY

**Issue:** `getNestedValue()` function is duplicated in `useFormField.ts`

**Current:**
```typescript
// In useFormField.ts
function getNestedValue(obj: any, path: string | string[]): any {
  // ... implementation
}
```

**Recommendation:** Extract to `frontend/src/hooks/utils/formUtils.ts`

**Functions to Extract:**
- `getNestedValue()` - Get nested value from object using path
- `setNestedValue()` - Set nested value in object (if needed)
- `hasNestedValue()` - Check if nested value exists (if needed)

**Benefits:**
- Reusable across hooks
- Easier to test independently
- Single source of truth

---

### 2. Node Positioning Utilities 🟢 LOW PRIORITY

**Issue:** Node positioning logic duplicated in `useMarketplaceIntegration.ts`

**Current Pattern:**
```typescript
const startX = currentNodes.length > 0 
  ? Math.max(...currentNodes.map(n => n.position.x)) + 200 
  : 250
let currentY = 250
```

**Recommendation:** Extract to `frontend/src/hooks/utils/nodePositioning.ts`

**Functions to Extract:**
- `calculateNextNodePosition()` - Calculate position for new node
- `getMaxNodeX()` - Get maximum X position from nodes
- `getMaxNodeY()` - Get maximum Y position from nodes
- `calculateGridPosition()` - Calculate grid-based positioning

**Benefits:**
- Consistent node positioning across hooks
- Easier to adjust spacing/positioning logic
- Reusable for other node operations

---

### 3. Draft Storage Utilities 🟢 LOW PRIORITY

**Issue:** Draft storage functions are exported from `useDraftManagement.ts` but could be utilities

**Current:**
```typescript
// In useDraftManagement.ts
export const loadDraftsFromStorage = (): Record<string, TabDraft> => { ... }
export const saveDraftsToStorage = (drafts: Record<string, TabDraft>) => { ... }
```

**Recommendation:** Move to `frontend/src/hooks/utils/draftStorage.ts`

**Benefits:**
- Clearer separation of concerns
- Easier to test storage operations independently
- Can be reused by other hooks

---

## Priority 3: Split Large Hooks (SRP Compliance)

### 1. `useTemplateOperations.ts` 🔴 HIGH PRIORITY

**Current:** 302 lines, 4 main responsibilities

**Responsibilities:**
1. Using templates (navigate to workflow)
2. Deleting agents
3. Deleting workflows
4. Deleting repository agents

**Recommendation:** Split into:
- `useTemplateUsage.ts` - Handle template usage/navigation
- `useAgentDeletion.ts` - Handle agent deletion logic
- `useWorkflowDeletion.ts` - Handle workflow deletion logic
- `useTemplateOperations.ts` - Compose the above hooks

**Benefits:**
- Single Responsibility Principle compliance
- Easier to test each operation independently
- Clearer code organization

---

### 2. `useExecutionManagement.ts` 🟡 MEDIUM PRIORITY

**Current:** 269 lines, multiple responsibilities

**Responsibilities:**
1. Execution start handling
2. Execution clearing/removal
3. Real-time updates (logs, status, nodes)
4. Polling fallback

**Recommendation:** Split into:
- `useExecutionUpdates.ts` - Real-time updates (logs, status, nodes)
- `useExecutionPolling.ts` - Polling fallback logic
- Keep core operations in `useExecutionManagement.ts`

**Benefits:**
- Better separation of concerns
- Easier to test polling independently
- Can disable polling without affecting updates

---

### 3. `useMarketplaceIntegration.ts` 🟡 MEDIUM PRIORITY

**Current:** 197 lines, handles agent addition to canvas

**Could Split:**
- Node creation logic
- Draft storage updates
- Position calculation

**Recommendation:** Extract utilities first, then consider splitting if still complex

---

## Priority 4: Code Organization Improvements

### 1. Extract Validation Utilities 🟢 LOW PRIORITY

**Pattern Found:** Name validation logic in `useTabRenaming.ts`

**Current:**
```typescript
const trimmedName = requestedName.trim()
if (trimmedName === '') {
  showError('Workflow name cannot be empty.')
  return
}
```

**Recommendation:** Extract to `frontend/src/hooks/utils/validation.ts`

**Functions:**
- `validateWorkflowName()` - Validate workflow/tab names
- `sanitizeName()` - Sanitize and trim names
- `isValidName()` - Check if name is valid

---

### 2. Extract Ownership Utilities 🟡 MEDIUM PRIORITY

**Pattern Found:** Ownership checking logic duplicated in `useTemplateOperations.ts`

**Current Pattern:**
```typescript
const userOwnedAgents = deletableAgents.filter(a => {
  if (!user || !a || !a.author_id || !user.id) return false
  const authorIdStr = String(a.author_id)
  const userIdStr = String(user.id)
  return authorIdStr === userIdStr
})
```

**Recommendation:** Extract to `frontend/src/hooks/utils/ownership.ts`

**Functions:**
- `isUserOwned()` - Check if item is owned by user
- `filterUserOwned()` - Filter items owned by user
- `filterOfficial()` - Filter official items

**Benefits:**
- Consistent ownership logic
- Easier to test
- Reusable across hooks

---

### 3. Extract API Request Utilities 🟢 LOW PRIORITY

**Pattern Found:** Authorization header building in `useTemplateOperations.ts`

**Current:**
```typescript
const headers: HeadersInit = { 'Content-Type': 'application/json' }
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}
```

**Recommendation:** Extract to `frontend/src/hooks/utils/apiUtils.ts`

**Functions:**
- `buildAuthHeaders()` - Build headers with authorization
- `buildJsonHeaders()` - Build JSON content-type headers

---

## Priority 5: File Organization

### Current Structure
```
frontend/src/hooks/
├── *.ts (all hooks in root)
└── utils/
    ├── tabUtils.ts
    ├── confirmations.ts
    └── ...
```

### Recommended Structure
```
frontend/src/hooks/
├── tabs/
│   ├── useTabCreation.ts
│   ├── useTabClosing.ts
│   ├── useTabWorkflowSync.ts
│   ├── useTabOperations.ts (composes above)
│   ├── useTabInitialization.ts
│   └── useTabRenaming.ts
├── marketplace/
│   ├── useMarketplaceData.ts
│   ├── useMarketplaceIntegration.ts
│   ├── useMarketplacePublishing.ts
│   ├── useMarketplaceDialog.ts
│   └── useTemplateOperations.ts
├── workflow/
│   ├── useWorkflowAPI.ts
│   ├── useWorkflowExecution.ts
│   ├── useWorkflowLoader.ts
│   ├── useWorkflowPersistence.ts
│   ├── useWorkflowState.ts
│   └── useWorkflowUpdates.ts
├── nodes/
│   ├── useNodeOperations.ts
│   ├── useNodeForm.ts
│   ├── useNodeSelection.ts
│   └── useSelectedNode.ts
├── execution/
│   ├── useExecutionManagement.ts
│   └── useWebSocket.ts
├── forms/
│   ├── useFormField.ts
│   └── usePublishForm.ts
├── utils/
│   ├── tabUtils.ts
│   ├── confirmations.ts
│   ├── formUtils.ts (new)
│   ├── ownership.ts (new)
│   └── ...
└── index.ts (re-exports)
```

**Benefits:**
- Clearer organization by domain
- Easier to find related hooks
- Better code navigation
- Scalable structure

**Note:** This is a larger refactoring that would require updating all imports. Consider doing this incrementally.

---

## Priority 6: Additional DRY Violations

### 1. Error Message Patterns 🟡 MEDIUM PRIORITY

**Pattern Found:** Similar error messages across hooks

**Examples:**
- "Storage not available" (in multiple hooks)
- "Failed to delete..." (in useTemplateOperations)
- "Cannot delete official..." (in useTemplateOperations)

**Recommendation:** Extract to `frontend/src/hooks/utils/errorMessages.ts`

**Constants:**
```typescript
export const ERROR_MESSAGES = {
  STORAGE_NOT_AVAILABLE: 'Storage not available',
  CANNOT_DELETE_OFFICIAL: (count: number, type: string) => 
    `Cannot delete ${count} official ${type}(s). Official ${type}s cannot be deleted.`,
  // ... more
}
```

---

### 2. Confirmation Message Patterns 🟢 LOW PRIORITY

**Pattern Found:** Similar confirmation messages

**Examples:**
- "Are you sure you want to delete..."
- "You can only delete..."

**Recommendation:** Already partially addressed with `confirmations.ts`, but could add more specific helpers

---

## Implementation Priority

### Phase 3: Quick Wins (1-2 days)
1. ✅ Add dependency injection to `useTabRenaming.ts`
2. ✅ Add dependency injection to `useMarketplaceIntegration.ts`
3. ✅ Add dependency injection to `useDraftManagement.ts`
4. ✅ Extract `getNestedValue()` to `formUtils.ts`

### Phase 4: Medium Effort (3-5 days)
1. ✅ Add dependency injection to `useTemplateOperations.ts`
2. ✅ Extract ownership utilities
3. ✅ Extract validation utilities
4. ✅ Split `useTemplateOperations.ts` into focused hooks

### Phase 5: Larger Refactoring (1-2 weeks)
1. ✅ Split `useExecutionManagement.ts`
2. ✅ Reorganize hooks into domain folders
3. ✅ Extract node positioning utilities
4. ✅ Extract draft storage utilities

---

## Expected Benefits

### Code Quality
- ✅ Better SOLID compliance
- ✅ Improved testability
- ✅ Reduced code duplication
- ✅ Clearer code organization

### Maintainability
- ✅ Easier to find related code
- ✅ Single source of truth for common operations
- ✅ Easier to modify without side effects
- ✅ Better code navigation

### Testability
- ✅ Easier to mock dependencies
- ✅ Utilities can be tested independently
- ✅ Focused hooks are easier to test
- ✅ Better test coverage potential

---

## Files to Create

### Utilities (Priority 1-2)
1. `frontend/src/hooks/utils/formUtils.ts` - Form field utilities
2. `frontend/src/hooks/utils/ownership.ts` - Ownership checking utilities
3. `frontend/src/hooks/utils/validation.ts` - Validation utilities
4. `frontend/src/hooks/utils/apiUtils.ts` - API request utilities
5. `frontend/src/hooks/utils/nodePositioning.ts` - Node positioning utilities
6. `frontend/src/hooks/utils/draftStorage.ts` - Draft storage utilities

### New Hooks (Priority 3)
1. `frontend/src/hooks/useTemplateUsage.ts` - Template usage only
2. `frontend/src/hooks/useAgentDeletion.ts` - Agent deletion only
3. `frontend/src/hooks/useWorkflowDeletion.ts` - Workflow deletion only
4. `frontend/src/hooks/useExecutionUpdates.ts` - Execution updates only
5. `frontend/src/hooks/useExecutionPolling.ts` - Execution polling only

---

## Metrics

### Current State
- **Hooks with DI:** 3 (useExecutionManagement, useNodeOperations, useWorkflowAPI)
- **Hooks needing DI:** 4+ (useTemplateOperations, useTabRenaming, useMarketplaceIntegration, useDraftManagement)
- **Utility modules:** 2 (tabUtils, confirmations)
- **Potential utilities:** 6+ (formUtils, ownership, validation, etc.)

### After Implementation
- **Hooks with DI:** 7+ (all hooks that need it)
- **Utility modules:** 8+ (comprehensive utility coverage)
- **Focused hooks:** More hooks following SRP
- **Better organization:** Domain-based folder structure

---

## Conclusion

While significant improvements have been made, there are still opportunities for:

1. **Dependency Injection** - 4+ hooks still need DI
2. **Utility Extraction** - 6+ utility modules could be created
3. **Hook Splitting** - 2-3 hooks could be split for SRP compliance
4. **File Organization** - Domain-based folder structure would improve navigation

These improvements would further enhance code quality, maintainability, and testability while maintaining 100% backward compatibility.
