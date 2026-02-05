# Phase 9: File Reorganization - Move Hooks to Domain Folders

## Overview

Move hook files from the root `hooks/` directory into their respective domain folders. This completes the physical organization that was started in Phase 5 with domain-based imports.

## Current State

- **Hooks Location**: All hooks in `frontend/src/hooks/` (root level)
- **Domain Folders**: Exist with `index.ts` files that re-export from root
- **Imports**: All using domain-based paths (`../hooks/domain`)
- **Status**: Domain structure exists but files haven't been moved

## Goal

Move all hook files into their domain folders and update:
1. File locations
2. Domain index.ts files (export from local files)
3. Test file locations
4. All import paths
5. Utility file references

## Migration Strategy

### Step 1: Execution Domain
Move execution-related hooks:
- `useExecutionManagement.ts` → `execution/useExecutionManagement.ts`
- `useWorkflowExecution.ts` → `execution/useWorkflowExecution.ts`
- `useWebSocket.ts` → `execution/useWebSocket.ts`
- `useWebSocket.utils.ts` → `execution/useWebSocket.utils.ts`
- `useWebSocket.test.setup.ts` → `execution/useWebSocket.test.setup.ts`

### Step 2: Workflow Domain
Move workflow-related hooks:
- `useWorkflowAPI.ts` → `workflow/useWorkflowAPI.ts`
- `useWorkflowState.ts` → `workflow/useWorkflowState.ts`
- `useWorkflowLoader.ts` → `workflow/useWorkflowLoader.ts`
- `useWorkflowPersistence.ts` → `workflow/useWorkflowPersistence.ts`
- `useWorkflowUpdates.ts` → `workflow/useWorkflowUpdates.ts`
- `useWorkflowUpdateHandler.ts` → `workflow/useWorkflowUpdateHandler.ts`
- `useWorkflowDeletion.ts` → `workflow/useWorkflowDeletion.ts`

### Step 3: Marketplace Domain
Move marketplace-related hooks:
- `useMarketplaceData.ts` → `marketplace/useMarketplaceData.ts`
- `useMarketplaceData.utils.ts` → `marketplace/useMarketplaceData.utils.ts`
- `useMarketplaceIntegration.ts` → `marketplace/useMarketplaceIntegration.ts`
- `useMarketplacePublishing.ts` → `marketplace/useMarketplacePublishing.ts`
- `useMarketplaceDialog.ts` → `marketplace/useMarketplaceDialog.ts`
- `useTemplatesData.ts` → `marketplace/useTemplatesData.ts`
- `useAgentsData.ts` → `marketplace/useAgentsData.ts`
- `useRepositoryAgentsData.ts` → `marketplace/useRepositoryAgentsData.ts`
- `useWorkflowsOfWorkflowsData.ts` → `marketplace/useWorkflowsOfWorkflowsData.ts`
- `useTemplateOperations.ts` → `marketplace/useTemplateOperations.ts`
- `useTemplateUsage.ts` → `marketplace/useTemplateUsage.ts`
- `useAgentDeletion.ts` → `marketplace/useAgentDeletion.ts`
- `useOfficialAgentSeeding.ts` → `marketplace/useOfficialAgentSeeding.ts`

### Step 4: Tabs Domain
Move tab-related hooks:
- `useTabOperations.ts` → `tabs/useTabOperations.ts`
- `useTabCreation.ts` → `tabs/useTabCreation.ts`
- `useTabClosing.ts` → `tabs/useTabClosing.ts`
- `useTabRenaming.ts` → `tabs/useTabRenaming.ts`
- `useTabWorkflowSync.ts` → `tabs/useTabWorkflowSync.ts`
- `useTabInitialization.ts` → `tabs/useTabInitialization.ts`

### Step 5: Nodes Domain
Move node-related hooks:
- `useNodeOperations.ts` → `nodes/useNodeOperations.ts`
- `useNodeSelection.ts` → `nodes/useNodeSelection.ts`
- `useNodeForm.ts` → `nodes/useNodeForm.ts`
- `useSelectedNode.ts` → `nodes/useSelectedNode.ts`
- `useSelectionManager.ts` → `nodes/useSelectionManager.ts`

### Step 6: UI Domain
Move UI-related hooks:
- `useCanvasEvents.ts` → `ui/useCanvasEvents.ts`
- `useContextMenu.ts` → `ui/useContextMenu.ts`
- `usePanelState.ts` → `ui/usePanelState.ts`
- `useKeyboardShortcuts.ts` → `ui/useKeyboardShortcuts.ts`
- `useKeyboardShortcuts.utils.ts` → `ui/useKeyboardShortcuts.utils.ts`
- `useClipboard.ts` → `ui/useClipboard.ts`

### Step 7: Storage Domain
Move storage-related hooks:
- `useLocalStorage.ts` → `storage/useLocalStorage.ts`
- `useLocalStorage.utils.ts` → `storage/useLocalStorage.utils.ts`
- `useAutoSave.ts` → `storage/useAutoSave.ts`
- `useDraftManagement.ts` → `storage/useDraftManagement.ts`

### Step 8: Providers Domain
Move provider-related hooks:
- `useLLMProviders.ts` → `providers/useLLMProviders.ts`
- `useProviderManagement.ts` → `providers/useProviderManagement.ts`

### Step 9: API Domain
Move API-related hooks:
- `useAuthenticatedApi.ts` → `api/useAuthenticatedApi.ts`

### Step 10: Forms Domain
Move form-related hooks:
- `useFormField.ts` → `forms/useFormField.ts`
- `usePublishForm.ts` → `forms/usePublishForm.ts`
- `useLoopConfig.ts` → `forms/useLoopConfig.ts`

## Update Requirements

### 1. Domain Index Files
Update each domain's `index.ts` to export from local files:
```typescript
// Before (re-exporting from root):
export { useExecutionManagement } from '../useExecutionManagement'

// After (exporting from local):
export { useExecutionManagement } from './useExecutionManagement'
```

### 2. Import Path Updates
All imports using domain paths will continue to work, but internal imports within hooks need updating:
- Relative imports within moved files need path adjustments
- Cross-domain imports stay the same (using domain paths)
- Utility imports need path updates

### 3. Test Files
Move test files to match hook locations:
- `useExecutionManagement.test.ts` → `execution/useExecutionManagement.test.ts`
- Update test imports to match new locations

### 4. Utility References
Update utility imports in moved hooks:
- `../utils/...` → `../../utils/...` (one level deeper)
- Or use absolute paths from hooks root

## Benefits

1. **Physical Organization**: Files match logical organization
2. **Better Navigation**: Find files by domain in file explorer
3. **Clearer Structure**: Domain boundaries are visible in file system
4. **Easier Maintenance**: Related files grouped together
5. **Scalability**: Easy to add new hooks to domains

## Risks & Mitigation

### Risk: Breaking Imports
- **Mitigation**: Domain-based imports already in place, so most imports won't break
- **Mitigation**: Update domain index files first, then move files

### Risk: Test Failures
- **Mitigation**: Move tests with hooks, update imports incrementally
- **Mitigation**: Run tests after each domain migration

### Risk: Utility Import Paths
- **Mitigation**: Update utility imports systematically
- **Mitigation**: Use relative paths from domain folders

## Implementation Order

1. **Start with smallest domain** (API - 1 file) to validate process
2. **Move execution domain** (3 files + utils)
3. **Move workflow domain** (7 files)
4. **Move remaining domains** incrementally
5. **Update all domain index files**
6. **Move and update test files**
7. **Verify all tests pass**
8. **Update documentation**

## Success Criteria

- ✅ All hook files moved to domain folders
- ✅ All domain index files updated
- ✅ All imports working correctly
- ✅ All test files moved and updated
- ✅ All tests passing
- ✅ No broken imports
- ✅ Documentation updated
