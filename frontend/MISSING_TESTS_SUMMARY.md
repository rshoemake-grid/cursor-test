# Missing Tests Summary

## Overview

This document lists all new files created during Phases 3-5 that currently **do not have unit tests**.

---

## Files Missing Tests

### Phase 3: Utility Extraction (3 files)

#### 1. `frontend/src/hooks/utils/validation.ts` ❌
**Status:** No test file exists
**Functions to Test:**
- `validateWorkflowName()` - Validates workflow/tab names
- `sanitizeName()` - Sanitizes and trims names
- `isValidName()` - Checks if name is valid
- `hasNameChanged()` - Checks if name actually changed

**Priority:** 🔴 HIGH - Used by `useTabRenaming.ts`

---

#### 2. `frontend/src/hooks/utils/errorHandling.ts` ❌
**Status:** No test file exists
**Functions to Test:**
- `extractErrorMessage()` - Extract error message from various formats
- `handleApiError()` - Handle API errors with logging and notifications
- `handleError()` - Handle generic errors consistently
- `createSafeErrorHandler()` - Create error handlers that won't throw

**Priority:** 🟡 MEDIUM - Utility functions, used by hooks

---

#### 3. `frontend/src/hooks/utils/ownership.ts` ⚠️
**Status:** Re-exports from `utils/ownershipUtils.ts`
**Note:** May have tests elsewhere, but should verify coverage
**Priority:** 🟢 LOW - Re-exports only

---

### Phase 4: Utility Extraction (3 files)

#### 4. `frontend/src/hooks/utils/nodePositioning.ts` ❌
**Status:** No test file exists
**Functions to Test:**
- `getMaxNodeX()` - Get maximum X position from nodes
- `getMaxNodeY()` - Get maximum Y position from nodes
- `calculateNextNodePosition()` - Calculate position for single new node
- `calculateMultipleNodePositions()` - Calculate positions for multiple nodes
- `calculateGridPosition()` - Calculate grid-based positioning
- `calculateRelativePosition()` - Calculate position relative to reference node

**Priority:** 🔴 HIGH - Used by `useMarketplaceIntegration.ts`

---

#### 5. `frontend/src/hooks/utils/draftStorage.ts` ❌
**Status:** No test file exists
**Functions to Test:**
- `loadDraftsFromStorage()` - Load all drafts
- `saveDraftsToStorage()` - Save all drafts
- `getDraftForTab()` - Get draft for specific tab
- `saveDraftForTab()` - Save draft for specific tab
- `deleteDraftForTab()` - Delete draft for specific tab
- `clearAllDrafts()` - Clear all drafts
- `draftExists()` - Check if draft exists

**Priority:** 🟡 MEDIUM - Storage operations, used by `useDraftManagement.ts`

---

#### 6. `frontend/src/hooks/utils/apiUtils.ts` ❌
**Status:** No test file exists
**Functions to Test:**
- `buildAuthHeaders()` - Build headers with authorization token
- `buildJsonHeaders()` - Build JSON content-type headers
- `buildUploadHeaders()` - Build headers for file uploads
- `extractApiErrorMessage()` - Extract error message from API errors
- `isApiResponseOk()` - Check if API response is successful
- `parseJsonResponse()` - Parse JSON response safely

**Priority:** 🔴 HIGH - Used by multiple hooks (`useTemplateOperations.ts`, `useTemplateUsage.ts`)

---

### Phase 5: Hook Splitting (3 files)

#### 7. `frontend/src/hooks/useTemplateUsage.ts` ❌
**Status:** No test file exists (file was updated, not newly created)
**Functions to Test:**
- `useTemplate()` - Use a template to create a new workflow

**Priority:** 🔴 HIGH - Core functionality, used by `useTemplateOperations.ts`

---

#### 8. `frontend/src/hooks/useAgentDeletion.ts` ❌
**Status:** No test file exists
**Hooks to Test:**
- `useAgentDeletion()` - Delete marketplace agents
- `useRepositoryAgentDeletion()` - Delete repository agents

**Priority:** 🔴 HIGH - Core functionality, used by `useTemplateOperations.ts`
**Note:** `useTemplateOperations.test.ts` has tests for these functions, but they should be tested independently

---

#### 9. `frontend/src/hooks/useWorkflowDeletion.ts` ❌
**Status:** No test file exists
**Functions to Test:**
- `deleteSelectedWorkflows()` - Delete selected workflows

**Priority:** 🔴 HIGH - Core functionality, used by `useTemplateOperations.ts`
**Note:** `useTemplateOperations.test.ts` has tests for this function, but it should be tested independently

---

## Summary

| Category | Files Missing Tests | Priority |
|----------|-------------------|----------|
| **Utility Files** | 5 files | 🔴 HIGH (3), 🟡 MEDIUM (2) |
| **Hook Files** | 3 files | 🔴 HIGH (all) |
| **Re-exports** | 1 file (verify) | 🟢 LOW |
| **Total** | **8-9 files** | |

---

## Test Coverage Status

### Files WITH Tests ✅
- `frontend/src/hooks/utils/tabUtils.ts` → `tabUtils.test.ts` ✅
- `frontend/src/hooks/utils/confirmations.ts` → `confirmations.test.ts` ✅
- `frontend/src/hooks/useTabCreation.ts` → `useTabCreation.test.ts` ✅
- `frontend/src/hooks/useTabClosing.ts` → `useTabClosing.test.ts` ✅
- `frontend/src/hooks/useTabWorkflowSync.ts` → `useTabWorkflowSync.test.ts` ✅

### Files WITHOUT Tests ❌
- `frontend/src/hooks/utils/validation.ts` ❌
- `frontend/src/hooks/utils/errorHandling.ts` ❌
- `frontend/src/hooks/utils/nodePositioning.ts` ❌
- `frontend/src/hooks/utils/draftStorage.ts` ❌
- `frontend/src/hooks/utils/apiUtils.ts` ❌
- `frontend/src/hooks/useTemplateUsage.ts` ❌
- `frontend/src/hooks/useAgentDeletion.ts` ❌
- `frontend/src/hooks/useWorkflowDeletion.ts` ❌

---

## Testing Patterns to Follow

Based on existing test files:

### Utility Tests (like `tabUtils.test.ts`)
- Use `describe` blocks for each function
- Test happy paths
- Test edge cases (empty arrays, null values, etc.)
- Test error conditions
- Use descriptive test names: `it('should ...')`

### Hook Tests (like `useFormField.test.ts`)
- Use `@testing-library/react` (`renderHook`, `act`)
- Mock external dependencies
- Test state updates
- Test callback invocations
- Test async operations

### Mock Patterns (like `confirmations.test.ts`)
- Mock external utilities (`showConfirm`, `showError`, etc.)
- Use `jest.fn()` for callbacks
- Clear mocks in `beforeEach`

---

## Recommended Test Files to Create

1. `frontend/src/hooks/utils/validation.test.ts` - HIGH PRIORITY
2. `frontend/src/hooks/utils/nodePositioning.test.ts` - HIGH PRIORITY
3. `frontend/src/hooks/utils/apiUtils.test.ts` - HIGH PRIORITY
4. `frontend/src/hooks/useTemplateUsage.test.ts` - HIGH PRIORITY
5. `frontend/src/hooks/useAgentDeletion.test.ts` - HIGH PRIORITY
6. `frontend/src/hooks/useWorkflowDeletion.test.ts` - HIGH PRIORITY
7. `frontend/src/hooks/utils/errorHandling.test.ts` - MEDIUM PRIORITY
8. `frontend/src/hooks/utils/draftStorage.test.ts` - MEDIUM PRIORITY

---

## Next Steps

1. Create test files following existing patterns
2. Ensure comprehensive coverage of all functions
3. Test edge cases and error conditions
4. Verify tests pass and maintain existing test suite compatibility
