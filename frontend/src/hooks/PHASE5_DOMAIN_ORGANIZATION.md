# Phase 5: Domain-Based Hook Organization

## Overview

Created domain-based folder structure for better code organization and navigation. Hooks are now grouped by their primary domain/responsibility.

## Domain Structure

```
hooks/
├── execution/     # Execution-related hooks
├── workflow/      # Workflow management hooks
├── marketplace/   # Marketplace and template hooks
├── tabs/          # Tab management hooks
├── nodes/         # Node operations hooks
├── ui/            # UI interaction hooks
├── storage/       # Storage and persistence hooks
├── providers/     # LLM provider hooks
├── api/           # API-related hooks
└── forms/         # Form-related hooks
```

## Benefits

1. **Better Organization**: Related hooks are grouped together
2. **Easier Navigation**: Clear domain boundaries
3. **Backward Compatible**: Index files re-export from original locations
4. **Gradual Migration**: Can update imports to use domain paths over time

## Usage

### Current (Still Works)
```typescript
import { useExecutionManagement } from '../hooks/useExecutionManagement'
```

### New Domain-Based (Recommended)
```typescript
import { useExecutionManagement } from '../hooks/execution'
```

## Domain Breakdown

### Execution Domain
- `useExecutionManagement` - Execution state management
- `useWorkflowExecution` - Workflow execution logic
- `useWebSocket` - WebSocket connection management

### Workflow Domain
- `useWorkflowAPI` - Workflow API operations
- `useWorkflowState` - Workflow state management
- `useWorkflowLoader` - Workflow loading logic
- `useWorkflowPersistence` - Workflow persistence
- `useWorkflowUpdates` - Workflow update handling
- `useWorkflowUpdateHandler` - Update handler logic
- `useWorkflowDeletion` - Workflow deletion

### Marketplace Domain
- `useMarketplaceData` - Marketplace data fetching
- `useMarketplaceIntegration` - Marketplace integration
- `useMarketplacePublishing` - Publishing workflows
- `useMarketplaceDialog` - Marketplace dialog management
- `useTemplatesData` - Templates data fetching
- `useAgentsData` - Agents data fetching
- `useRepositoryAgentsData` - Repository agents data
- `useWorkflowsOfWorkflowsData` - Workflows of workflows data
- `useTemplateOperations` - Template operations
- `useTemplateUsage` - Template usage
- `useAgentDeletion` - Agent deletion
- `useOfficialAgentSeeding` - Official agent seeding

### Tabs Domain
- `useTabOperations` - Tab operations
- `useTabCreation` - Tab creation
- `useTabClosing` - Tab closing
- `useTabRenaming` - Tab renaming
- `useTabWorkflowSync` - Tab-workflow synchronization
- `useTabInitialization` - Tab initialization

### Nodes Domain
- `useNodeOperations` - Node operations
- `useNodeSelection` - Node selection
- `useNodeForm` - Node form management
- `useSelectedNode` - Selected node state
- `useSelectionManager` - Selection management

### UI Domain
- `useCanvasEvents` - Canvas event handling
- `useContextMenu` - Context menu management
- `usePanelState` - Panel state management
- `useKeyboardShortcuts` - Keyboard shortcuts
- `useClipboard` - Clipboard operations

### Storage Domain
- `useLocalStorage` - Local storage operations
- `useAutoSave` - Auto-save functionality
- `useDraftManagement` - Draft management

### Providers Domain
- `useLLMProviders` - LLM provider management
- `useProviderManagement` - Provider operations

### API Domain
- `useAuthenticatedApi` - Authenticated API calls

### Forms Domain
- `useFormField` - Form field management
- `usePublishForm` - Publish form handling
- `useLoopConfig` - Loop configuration

## Migration Strategy

1. **Phase 1 (Current)**: Index files re-export from original locations
2. **Phase 2 (Future)**: Gradually update imports to use domain paths
3. **Phase 3 (Future)**: Optionally move files to domain folders (requires import updates)

## Notes

- All hooks remain in their original locations for backward compatibility
- Index files provide clean domain-based exports
- No breaking changes - existing imports continue to work
- New code can use domain-based imports for better organization
