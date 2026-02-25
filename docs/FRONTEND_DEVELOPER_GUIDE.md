# Frontend Developer Guide

## Overview

The frontend is a React-based visual workflow builder application built with TypeScript, React Flow, and modern React patterns. This guide provides developers with a comprehensive understanding of the codebase architecture, components, and development patterns.

## Tech Stack

- **React 18** - UI framework with hooks and context API
- **TypeScript** - Type-safe development
- **React Flow (@xyflow/react)** - Visual workflow editor canvas
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **Axios** - HTTP client for API communication
- **Recharts** - Chart library for analytics visualizations
- **Jest/Vitest** - Testing framework

## Project Structure

```
frontend/src/
├── components/          # React components
│   ├── WorkflowBuilder/    # Main workflow canvas editor
│   ├── nodes/              # Custom node components (Agent, Condition, Loop, etc.)
│   ├── PropertyPanel/      # Node property configuration panel
│   ├── marketplace/        # Marketplace components
│   ├── forms/              # Reusable form components
│   └── settings/           # Settings UI components
├── hooks/               # Custom React hooks
│   ├── workflow/           # Workflow-related hooks
│   ├── execution/          # Execution management hooks
│   ├── log/                # Log page hooks
│   │   ├── useExecutionList.ts  # Execution list management
│   │   └── useExecutionListQuery.ts  # React Query hook for executions
│   ├── analytics/          # Analytics hooks
│   │   └── useExecutionAnalytics.ts  # Analytics calculations
│   ├── marketplace/        # Marketplace hooks
│   ├── nodes/              # Node-related hooks
│   ├── forms/              # Form handling hooks
│   ├── storage/            # LocalStorage hooks
│   ├── api/                # API interaction hooks
│   └── utils/              # Utility hooks (debounce, sync, etc.)
├── contexts/            # React Context providers
│   ├── AuthContext.tsx     # Authentication state
│   └── WorkflowTabsContext.tsx  # Workflow tabs management
├── pages/               # Page-level components
│   ├── AuthPage.tsx         # Login/Register page
│   ├── MarketplacePage.tsx  # Marketplace/discovery page
│   ├── SettingsPage.tsx     # Settings page
│   ├── LogPage.tsx         # Execution log page
│   └── AnalyticsPage.tsx    # Analytics dashboard with charts
├── api/                 # API client and utilities
│   └── client.ts           # Axios-based API client
├── types/               # TypeScript type definitions
│   ├── workflow.ts         # Workflow-related types
│   └── adapters.ts         # Adapter interfaces
├── utils/               # Utility functions
│   ├── logger.ts           # Logging utility
│   ├── confirm.ts          # Confirmation dialogs
│   └── executionFormat.tsx # Execution formatting utilities
├── adapters/            # Adapter implementations
│   └── defaultAdapters.ts  # Default adapter factories
├── config/             # Configuration
├── constants/          # Application constants
├── test/              # Test utilities
└── App.tsx            # Root component
```

## Core Components

### 1. WorkflowBuilder (`components/WorkflowBuilder.tsx`)

The main visual workflow editor component. Handles:
- **Canvas Management**: Zoom, pan, minimap controls
- **Node Operations**: Drag & drop, selection, deletion
- **Edge Operations**: Creating connections between nodes
- **State Management**: Integrates with Zustand store for workflow state
- **Integration**: Coordinates with NodePanel and PropertyPanel

**Key Features:**
- React Flow integration for visual editing
- Real-time node/edge updates
- Auto-save functionality
- Undo/redo support (via store)

### 2. Node Components (`components/nodes/`)

Custom node types for the workflow:
- **StartNode** - Entry point of workflow
- **EndNode** - Exit point of workflow
- **AgentNode** - LLM-powered agent execution
- **ConditionNode** - Conditional branching logic
- **LoopNode** - Iteration and looping

Each node component:
- Renders visual representation on canvas
- Handles selection state
- Displays node-specific data
- Integrates with PropertyPanel for configuration

### 3. PropertyPanel (`components/PropertyPanel/`)

Right sidebar for configuring selected nodes:
- **Dynamic Forms**: Node-type-specific configuration forms
- **Real-time Updates**: Changes reflect immediately on canvas
- **Validation**: Input validation and error display
- **Nested Configuration**: Supports complex node configs (agent_config, loop_config, etc.)

### 4. NodePanel (`components/NodePanel.tsx`)

Left sidebar with draggable node templates:
- **Node Palette**: Available node types
- **Drag & Drop**: Drag nodes onto canvas
- **Categorization**: Groups nodes by type
- **Search**: Filter nodes by name

### 5. ExecutionViewer (`components/ExecutionViewer.tsx`)

Displays workflow execution results:
- **Real-time Updates**: WebSocket integration for live updates
- **Log Display**: Execution logs and node states
- **Result Visualization**: Shows execution output
- **Error Handling**: Displays errors and stack traces

### 6. AnalyticsPage (`pages/AnalyticsPage.tsx`)

Analytics dashboard with execution metrics and visualizations:
- **Key Metrics**: Total executions, success rate, average duration, failed executions
- **Charts**: Success rate over time, duration trends, status distribution, executions over time
- **Data Visualization**: Uses Recharts library for interactive charts
- **Real-time Updates**: Polls execution data and updates charts automatically

### 7. ExecutionDetailsModal (`components/log/ExecutionDetailsModal.tsx`)

Modal for viewing detailed execution information:
- **Execution Details**: Status, timestamps, workflow ID, node states
- **Log Display**: Formatted execution logs
- **Download Functionality**: Download logs as text or JSON files
- **Error Display**: Shows execution errors with formatting

## State Management

### Zustand Store (`store/workflowStore.ts`)

Centralized state management for workflow data:
- **Workflow State**: Nodes, edges, variables
- **UI State**: Selected nodes, viewport position
- **Actions**: CRUD operations for nodes/edges
- **Persistence**: Auto-saves to localStorage

### React Context

**AuthContext** (`contexts/AuthContext.tsx`):
- Manages authentication state
- Provides login/logout functions
- Handles token storage
- Protects routes

**WorkflowTabsContext** (`contexts/WorkflowTabsContext.tsx`):
- Manages multiple workflow tabs
- Handles tab switching
- Persists tab state

## Custom Hooks Architecture

The codebase follows a **hook-based architecture** with custom hooks organized by domain:

### Workflow Hooks (`hooks/workflow/`)

- **useWorkflowLoader**: Loads workflow from API
- **useWorkflowState**: Manages local workflow state
- **useWorkflowUpdateHandler**: Handles workflow updates
- **useWorkflowSave**: Saves workflow to backend

### Execution Hooks (`hooks/execution/`)

- **useWorkflowExecution**: Executes workflows
- **useExecutionManagement**: Manages execution lifecycle
- **useWebSocket**: WebSocket connection for real-time updates

### Node Hooks (`hooks/nodes/`)

- **useNodeForm**: Manages node form state
- **useNodeValidation**: Validates node configuration

### Form Hooks (`hooks/forms/`)

- **useFormField**: Generic form field with node data sync
- **useSimpleFormField**: Simplified form field without sync

### Storage Hooks (`hooks/storage/`)

- **useLocalStorage**: Persistent local storage with cross-tab sync
- **useAutoSave**: Debounced auto-save functionality

### Utility Hooks (`hooks/utils/`)

- **useDebounce**: Debounce values
- **useSyncState**: Sync external state to local state
- **useInputFieldSync**: Sync input fields with node data
- **useAsyncOperation**: Handle async operations with loading/error states

## API Integration

### API Client (`api/client.ts`)

Centralized Axios-based HTTP client:
- **Base Configuration**: Base URL, headers, interceptors
- **Authentication**: Automatic token injection
- **Error Handling**: Centralized error handling
- **Type Safety**: TypeScript types for requests/responses

**Usage Pattern:**
```typescript
import { apiClient } from './api/client'

const workflow = await apiClient.get(`/workflows/${id}`)
await apiClient.post('/workflows', workflowData)
```

### Custom API Hooks (`hooks/api/`)

- **useAuthenticatedApi**: Wrapper for authenticated API calls
- **useApiCall**: Generic hook for API calls with loading/error states

## Development Patterns

### 1. Dependency Injection

Components accept dependencies as props for testability:
```typescript
interface ComponentProps {
  storage?: StorageAdapter
  httpClient?: HttpClient
  logger?: Logger
}
```

### 2. Adapter Pattern

Abstraction layer for external dependencies:
- **StorageAdapter**: localStorage abstraction
- **HttpClient**: HTTP client abstraction
- **Logger**: Logging abstraction

### 3. Hook Composition

Build complex functionality by composing hooks:
```typescript
function useWorkflowEditor(workflowId: string) {
  const workflow = useWorkflowLoader(workflowId)
  const { save } = useWorkflowSave()
  const { execute } = useWorkflowExecution()
  
  return { workflow, save, execute }
}
```

### 4. DRY Principles

- **Reusable Hooks**: Common patterns extracted to hooks
- **Utility Functions**: Shared logic in utils
- **Component Composition**: Small, reusable components

### 5. SOLID Principles

- **Single Responsibility**: Each hook/component has one purpose
- **Dependency Inversion**: Depend on abstractions (adapters)
- **Open/Closed**: Extensible through hooks and adapters

## Testing

### Test Structure

Tests are co-located with components or in `__tests__` directories:
- **Component Tests**: React Testing Library
- **Hook Tests**: Custom renderHook utilities
- **Unit Tests**: Jest/Vitest for utilities

### Testing Patterns

```typescript
// Component test
import { render, screen } from '@testing-library/react'
import Component from './Component'

test('renders correctly', () => {
  render(<Component />)
  expect(screen.getByText('Hello')).toBeInTheDocument()
})

// Hook test
import { renderHook } from '@testing-library/react'
import { useCustomHook } from './useCustomHook'

test('hook works correctly', () => {
  const { result } = renderHook(() => useCustomHook())
  expect(result.current.value).toBe(expected)
})
```

## Common Development Tasks

### Adding a New Node Type

1. Create node component in `components/nodes/`
2. Add node type to `types/workflow.ts`
3. Create node form in PropertyPanel
4. Add node to NodePanel palette
5. Update workflow store to handle new node type

### Adding a New API Endpoint

1. Add endpoint to `api/client.ts` if needed
2. Create custom hook in `hooks/api/` or `hooks/workflow/`
3. Use hook in component
4. Add TypeScript types

### Adding a New Page

1. Create page component in `pages/`
2. Add route in `App.tsx`
3. Add navigation link if needed
4. Create page-specific hooks if needed

## Best Practices

1. **Type Safety**: Always use TypeScript types
2. **Hook Naming**: Use `use` prefix for custom hooks
3. **Component Organization**: Group related components in folders
4. **State Management**: Use Zustand for global state, useState for local
5. **Error Handling**: Always handle errors in async operations
6. **Performance**: Use React.memo, useMemo, useCallback when appropriate
7. **Accessibility**: Use semantic HTML and ARIA attributes
8. **Code Splitting**: Lazy load routes and heavy components

## Environment Variables

Create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Debugging

- **React DevTools**: Install browser extension
- **Zustand DevTools**: Available in development
- **Console Logging**: Use `logger` utility for consistent logging
- **Network Tab**: Check API calls and WebSocket connections

## Resources

- [React Documentation](https://react.dev/)
- [React Flow Documentation](https://reactflow.dev/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
