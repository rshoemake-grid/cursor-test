# Phase 7: Migration to Domain-Based Imports

## Overview

Migrate all hook imports from direct file paths to domain-based import paths created in Phase 5. This completes the domain organization work and makes imports cleaner and more maintainable.

## Migration Strategy

### Step 1: Update Component Imports ✅
- Update all component files to use domain imports
- Start with most-used components
- Verify tests still pass

### Step 2: Update Hook Internal Imports ✅
- Update imports within hooks directory
- Use domain paths for cross-domain imports
- Keep utils imports as-is (they're not in domains)

### Step 3: Update Test Files ✅
- Update test file imports
- Ensure all tests still pass
- Verify mock paths are correct

### Step 4: Update Other Files ✅
- Update imports in contexts, services, utils
- Complete migration across codebase

## Domain Import Mapping

### Execution Domain
```typescript
// Old:
import { useExecutionManagement } from '../hooks/useExecutionManagement'
import { useWorkflowExecution } from '../hooks/useWorkflowExecution'
import { useWebSocket } from '../hooks/useWebSocket'

// New:
import { useExecutionManagement, useWorkflowExecution, useWebSocket } from '../hooks/execution'
```

### Workflow Domain
```typescript
// Old:
import { useWorkflowAPI } from '../hooks/useWorkflowAPI'
import { useWorkflowState } from '../hooks/useWorkflowState'
import { useWorkflowLoader } from '../hooks/useWorkflowLoader'

// New:
import { useWorkflowAPI, useWorkflowState, useWorkflowLoader } from '../hooks/workflow'
```

### Marketplace Domain
```typescript
// Old:
import { useMarketplaceData } from '../hooks/useMarketplaceData'
import { useTemplateOperations } from '../hooks/useTemplateOperations'

// New:
import { useMarketplaceData, useTemplateOperations } from '../hooks/marketplace'
```

### Tabs Domain
```typescript
// Old:
import { useTabOperations } from '../hooks/useTabOperations'
import { useTabRenaming } from '../hooks/useTabRenaming'

// New:
import { useTabOperations, useTabRenaming } from '../hooks/tabs'
```

### Nodes Domain
```typescript
// Old:
import { useNodeOperations } from '../hooks/useNodeOperations'
import { useNodeSelection } from '../hooks/useNodeSelection'

// New:
import { useNodeOperations, useNodeSelection } from '../hooks/nodes'
```

### UI Domain
```typescript
// Old:
import { useCanvasEvents } from '../hooks/useCanvasEvents'
import { useContextMenu } from '../hooks/useContextMenu'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useClipboard } from '../hooks/useClipboard'

// New:
import { useCanvasEvents, useContextMenu, useKeyboardShortcuts, useClipboard } from '../hooks/ui'
```

### Storage Domain
```typescript
// Old:
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAutoSave } from '../hooks/useAutoSave'
import { useDraftManagement } from '../hooks/useDraftManagement'

// New:
import { useLocalStorage, useAutoSave, useDraftManagement } from '../hooks/storage'
```

### Providers Domain
```typescript
// Old:
import { useLLMProviders } from '../hooks/useLLMProviders'
import { useProviderManagement } from '../hooks/useProviderManagement'

// New:
import { useLLMProviders, useProviderManagement } from '../hooks/providers'
```

### API Domain
```typescript
// Old:
import { useAuthenticatedApi } from '../hooks/useAuthenticatedApi'

// New:
import { useAuthenticatedApi } from '../hooks/api'
```

### Forms Domain
```typescript
// Old:
import { useFormField } from '../hooks/useFormField'
import { usePublishForm } from '../hooks/usePublishForm'
import { useLoopConfig } from '../hooks/useLoopConfig'

// New:
import { useFormField, usePublishForm, useLoopConfig } from '../hooks/forms'
```

## Files to Update

### Components (Priority 1)
1. `WorkflowBuilder.tsx` - Many hook imports
2. `WorkflowTabs.tsx` - Multiple domain hooks
3. `PropertyPanel.tsx` - Nodes and providers
4. `MarketplaceDialog.tsx` - Marketplace hooks
5. `ExecutionConsole.tsx` - Execution hooks
6. Other component files

### Hooks (Priority 2)
- Cross-domain imports within hooks
- Internal hook dependencies

### Tests (Priority 3)
- Test file imports
- Mock paths

### Other Files (Priority 4)
- Context files
- Service files
- Utility files

## Benefits

1. **Cleaner Imports** - Domain-based paths are more readable
2. **Better Organization** - Clear domain boundaries in code
3. **Easier Navigation** - Domain paths show relationships
4. **Maintainability** - Changes to domain structure are centralized
5. **Completes Phase 5** - Finishes the domain organization work

## Migration Notes

- All old imports still work (backward compatible)
- Can migrate gradually, file by file
- Tests should continue to pass throughout migration
- No breaking changes - just cleaner imports
