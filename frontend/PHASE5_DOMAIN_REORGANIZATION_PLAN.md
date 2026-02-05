# Phase 5: Domain-Based Hook Reorganization Plan

## Overview

Reorganize hooks into domain folders to improve code navigation, maintainability, and clarity. This follows the Single Responsibility Principle at the organizational level.

## Current State

- **Total hooks:** ~50+ hooks in flat structure
- **Current location:** `frontend/src/hooks/`
- **Issues:**
  - Hard to find related hooks
  - No clear domain boundaries
  - Difficult to understand relationships

## Proposed Domain Structure

### 1. **execution/** - Execution Management
**Purpose:** Hooks related to workflow execution, polling, WebSocket connections

**Hooks:**
- `useExecutionManagement.ts` - Main execution management
- `useWorkflowExecution.ts` - Workflow execution logic
- `useWebSocket.ts` - WebSocket connections
- `useExecutionPolling.ts` - Polling fallback (utils)

**Utilities:**
- `executionStateManager.ts`
- `executionIdValidation.ts`
- `executionStatusValidation.ts`
- `workflowExecutionService.ts`

---

### 2. **workflow/** - Workflow Management
**Purpose:** Hooks for workflow CRUD operations, state management, persistence

**Hooks:**
- `useWorkflowState.ts` - Workflow state management
- `useWorkflowAPI.ts` - API operations
- `useWorkflowLoader.ts` - Loading workflows
- `useWorkflowPersistence.ts` - Persistence logic
- `useWorkflowUpdates.ts` - Update handling
- `useWorkflowUpdateHandler.ts` - Update handler
- `useWorkflowDeletion.ts` - Deletion logic
- `useTabWorkflowSync.ts` - Tab/workflow synchronization

---

### 3. **marketplace/** - Marketplace Operations
**Purpose:** Hooks for marketplace data, publishing, integration

**Hooks:**
- `useMarketplaceData.ts` - Main marketplace data
- `useMarketplaceIntegration.ts` - Integration logic
- `useMarketplacePublishing.ts` - Publishing workflows
- `useMarketplaceDialog.ts` - Dialog management
- `useTemplatesData.ts` - Templates data
- `useAgentsData.ts` - Agents data
- `useRepositoryAgentsData.ts` - Repository agents
- `useWorkflowsOfWorkflowsData.ts` - Workflows data
- `useTemplateOperations.ts` - Template operations
- `useTemplateUsage.ts` - Template usage
- `useAgentDeletion.ts` - Agent deletion
- `usePublishForm.ts` - Publish form

---

### 4. **tabs/** - Tab Management
**Purpose:** Hooks for managing workflow tabs

**Hooks:**
- `useTabOperations.ts` - Tab operations
- `useTabCreation.ts` - Tab creation
- `useTabRenaming.ts` - Tab renaming
- `useTabClosing.ts` - Tab closing
- `useTabInitialization.ts` - Tab initialization

---

### 5. **nodes/** - Node Operations
**Purpose:** Hooks for node manipulation and configuration

**Hooks:**
- `useNodeOperations.ts` - Node operations
- `useNodeSelection.ts` - Node selection
- `useSelectedNode.ts` - Selected node state
- `useSelectionManager.ts` - Selection management
- `useNodeForm.ts` - Node form
- `useLoopConfig.ts` - Loop configuration
- `useCanvasEvents.ts` - Canvas events

---

### 6. **ui/** - UI State & Interactions
**Purpose:** Hooks for UI state, panels, menus, shortcuts

**Hooks:**
- `usePanelState.ts` - Panel state
- `useContextMenu.ts` - Context menu
- `useKeyboardShortcuts.ts` - Keyboard shortcuts
- `useClipboard.ts` - Clipboard operations
- `useFormField.ts` - Form field

---

### 7. **providers/** - LLM Provider Management
**Purpose:** Hooks for managing LLM providers

**Hooks:**
- `useLLMProviders.ts` - LLM providers
- `useProviderManagement.ts` - Provider management
- `useOfficialAgentSeeding.ts` - Official agent seeding

---

### 8. **storage/** - Storage & Persistence
**Purpose:** Hooks for local storage, drafts, auto-save

**Hooks:**
- `useLocalStorage.ts` - Local storage
- `useAutoSave.ts` - Auto-save
- `useDraftManagement.ts` - Draft management

---

### 9. **api/** - API & Authentication
**Purpose:** Hooks for API calls and authentication

**Hooks:**
- `useAuthenticatedApi.ts` - Authenticated API
- `useWorkflowAPI.ts` - Workflow API (could move to workflow/)

---

### 10. **utils/** - Utility Hooks (Keep at root level)
**Purpose:** Generic, reusable utility hooks

**Hooks:**
- `useDataFetching.ts` - Generic data fetching
- `useAsyncOperation.ts` - Generic async operations

---

## Migration Strategy

### Phase 1: Create Domain Folders ✅
1. Create domain directories
2. Create index.ts files for each domain (barrel exports)

### Phase 2: Move Hooks
1. Move hooks to appropriate domains
2. Update imports in moved files
3. Update barrel exports

### Phase 3: Update Imports
1. Find all imports of moved hooks
2. Update import paths
3. Verify no broken imports

### Phase 4: Update Tests
1. Move test files to match hook locations
2. Update test imports
3. Run all tests to verify

### Phase 5: Cleanup
1. Remove old files
2. Update documentation
3. Verify build works

---

## Benefits

1. **Better Organization** ✅
   - Related hooks grouped together
   - Clear domain boundaries
   - Easier to navigate

2. **Improved Maintainability** ✅
   - Changes isolated to domains
   - Easier to find related code
   - Clearer dependencies

3. **Better Discoverability** ✅
   - New developers can find hooks by domain
   - Clear structure shows relationships
   - Easier code reviews

4. **Scalability** ✅
   - Easy to add new hooks to domains
   - Clear patterns for organization
   - Supports team collaboration

---

## Implementation Notes

- **Backward Compatibility:** Use barrel exports (index.ts) to maintain existing import paths
- **Gradual Migration:** Move hooks incrementally, test after each move
- **Documentation:** Update README/docs with new structure
- **Tests:** Ensure all tests pass after reorganization

---

## File Count Summary

| Domain | Hook Count | Utility Count |
|--------|-----------|---------------|
| execution | 4 | 4 |
| workflow | 8 | 0 |
| marketplace | 12 | 0 |
| tabs | 5 | 0 |
| nodes | 7 | 0 |
| ui | 5 | 0 |
| providers | 3 | 0 |
| storage | 3 | 0 |
| api | 2 | 0 |
| utils | 2 | 0 |
| **Total** | **51** | **4** |

---

## Next Steps

1. ✅ Create domain folder structure
2. ⏳ Move hooks to domains (incremental)
3. ⏳ Update all imports
4. ⏳ Update tests
5. ⏳ Verify everything works
