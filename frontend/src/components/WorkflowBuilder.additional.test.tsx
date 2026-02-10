import * as React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import WorkflowBuilder, { WorkflowBuilderHandle } from './WorkflowBuilder'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api/client'
import { showConfirm } from '../utils/confirm'
import type { StorageAdapter } from '../types/adapters'

jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}))

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../api/client', () => ({
  api: {
    createWorkflow: jest.fn(),
    updateWorkflow: jest.fn(),
    getWorkflow: jest.fn(),
    executeWorkflow: jest.fn(),
  },
}))

jest.mock('../utils/notifications', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
}))

jest.mock('../utils/confirm', () => ({
  showConfirm: jest.fn(),
}))

// Mock all child components
jest.mock('./NodePanel', () => ({
  __esModule: true,
  default: () => <div data-testid="node-panel">NodePanel</div>,
}))

jest.mock('./PropertyPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="property-panel">PropertyPanel</div>,
}))

jest.mock('./ExecutionConsole', () => ({
  __esModule: true,
  default: () => <div data-testid="execution-console">ExecutionConsole</div>,
}))

jest.mock('./ExecutionInputDialog', () => ({
  __esModule: true,
  default: () => <div data-testid="execution-input-dialog">ExecutionInputDialog</div>,
}))

jest.mock('./NodeContextMenu', () => ({
  __esModule: true,
  default: () => <div data-testid="node-context-menu">NodeContextMenu</div>,
}))

jest.mock('./MarketplaceDialog', () => ({
  __esModule: true,
  default: () => <div data-testid="marketplace-dialog">MarketplaceDialog</div>,
}))

jest.mock('./WorkflowCanvas', () => ({
  __esModule: true,
  default: () => <div data-testid="workflow-canvas">WorkflowCanvas</div>,
}))

jest.mock('./KeyboardHandler', () => ({
  __esModule: true,
  KeyboardHandler: () => null,
}))

jest.mock('./ReactFlowInstanceCapture', () => ({
  __esModule: true,
  ReactFlowInstanceCapture: () => null,
}))

jest.mock('./WorkflowBuilder/WorkflowBuilderLayout', () => ({
  __esModule: true,
  WorkflowBuilderLayout: ({ ...props }: any) => (
    <div data-testid="workflow-builder-layout">
      <div data-testid="node-panel">NodePanel</div>
      <div data-testid="workflow-canvas">WorkflowCanvas</div>
      <div data-testid="execution-console">ExecutionConsole</div>
      <div data-testid="property-panel">PropertyPanel</div>
    </div>
  ),
}))

jest.mock('./WorkflowBuilder/WorkflowBuilderDialogs', () => ({
  __esModule: true,
  WorkflowBuilderDialogs: () => (
    <>
      <div data-testid="execution-input-dialog">ExecutionInputDialog</div>
      <div data-testid="node-context-menu">NodeContextMenu</div>
      <div data-testid="marketplace-dialog">MarketplaceDialog</div>
    </>
  ),
}))

// Mock UI domain - Phase 7
jest.mock('../hooks/ui', () => ({
  useKeyboardShortcuts: jest.fn(),
  useClipboard: jest.fn(() => ({
    clipboardNode: null,
    onCopy: jest.fn(),
    onCut: jest.fn(),
    onPaste: jest.fn(),
  })),
  useContextMenu: jest.fn(),
  useCanvasEvents: jest.fn(),
  usePanelState: jest.fn(),
}))

jest.mock('./nodes', () => ({
  nodeTypes: {},
}))

jest.mock('@xyflow/react/dist/style.css', () => ({}))

// Mock React Flow hooks
jest.mock('@xyflow/react', () => {
  const React = require('react')
  return {
    ...jest.requireActual('@xyflow/react'),
    ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
    useNodesState: jest.fn(() => [[], jest.fn(), jest.fn()]),
    useEdgesState: jest.fn(() => [[], jest.fn(), jest.fn()]),
  }
})

// Mock all custom hooks - Domain-based imports - Phase 7
// These are already mocked above in the domain mocks section

// Mock storage domain - Phase 7
jest.mock('../hooks/storage', () => {
  const mockLoadDraftsFromStorage = jest.fn(() => ({}))
  return {
    useDraftManagement: jest.fn(() => ({
      loadDraft: jest.fn(),
      saveDraft: jest.fn(),
      clearDraft: jest.fn(),
    })),
    loadDraftsFromStorage: mockLoadDraftsFromStorage,
    useLocalStorage: jest.fn(),
    useAutoSave: jest.fn(),
    getLocalStorageItem: jest.fn(),
    setLocalStorageItem: jest.fn(),
  }
})

// Mock workflow domain - Phase 7
const mockUseWorkflowState = jest.fn(() => ({
  localWorkflowId: null,
  setLocalWorkflowId: jest.fn(),
  localWorkflowName: '',
  setLocalWorkflowName: jest.fn(),
  localWorkflowDescription: '',
  setLocalWorkflowDescription: jest.fn(),
  variables: {},
  setVariables: jest.fn(),
}))
const mockUseWorkflowPersistence = jest.fn(() => ({
  saveWorkflow: jest.fn().mockResolvedValue('workflow-1'),
  exportWorkflow: jest.fn(),
}))
const mockUseWorkflowUpdates = jest.fn(() => ({
  workflowNodeToNode: jest.fn(),
}))

jest.mock('../hooks/workflow', () => ({
  useWorkflowPersistence: (...args: any[]) => mockUseWorkflowPersistence(...args),
  useWorkflowLoader: jest.fn(),
  useWorkflowUpdateHandler: jest.fn(() => ({
    handleWorkflowUpdate: jest.fn(),
  })),
  useWorkflowState: (...args: any[]) => mockUseWorkflowState(...args),
  useWorkflowUpdates: (...args: any[]) => mockUseWorkflowUpdates(...args),
  useWorkflowAPI: jest.fn(),
  useWorkflowDeletion: jest.fn(),
}))

// Mock execution domain - Phase 7
const mockUseWorkflowExecution = jest.fn(() => ({
  executeWorkflow: jest.fn(),
  showInputs: false,
}))
const mockUseExecutionManagement = jest.fn()
const mockUseWebSocket = jest.fn()

jest.mock('../hooks/execution', () => ({
  useWorkflowExecution: (...args: any[]) => mockUseWorkflowExecution(...args),
  useExecutionManagement: (...args: any[]) => mockUseExecutionManagement(...args),
  useWebSocket: (...args: any[]) => mockUseWebSocket(...args),
}))

// Mock UI domain - Phase 7
jest.mock('../hooks/ui', () => ({
  useCanvasEvents: jest.fn(() => ({
    onDrop: jest.fn(),
    onDragOver: jest.fn(),
    onConnect: jest.fn(),
    onNodeClick: jest.fn(),
    onNodeContextMenu: jest.fn(),
    onEdgeContextMenu: jest.fn(),
    onPaneClick: jest.fn(),
  })),
  useContextMenu: jest.fn(() => ({
    contextMenu: null,
    onClose: jest.fn(),
  })),
  useClipboard: jest.fn(() => ({
    clipboardNode: null,
    onCopy: jest.fn(),
    onCut: jest.fn(),
    onPaste: jest.fn(),
  })),
  usePanelState: jest.fn(),
  useKeyboardShortcuts: jest.fn(),
}))

// Mock nodes domain - Phase 7
const mockUseNodeSelection = jest.fn(() => ({
  selectedNodeId: null,
  setSelectedNodeId: jest.fn(),
  selectedNodeIds: [],
  handleNodesChange: jest.fn(),
}))

jest.mock('../hooks/nodes', () => ({
  useNodeSelection: (...args: any[]) => mockUseNodeSelection(...args),
  useNodeOperations: jest.fn(),
  useNodeForm: jest.fn(),
  useSelectedNode: jest.fn(),
  useSelectionManager: jest.fn(),
}))

// Mock marketplace domain - Phase 7
jest.mock('../hooks/marketplace', () => ({
  useMarketplaceDialog: jest.fn(() => ({
    showMarketplaceDialog: false,
    marketplaceNode: null,
    openDialog: jest.fn(),
    closeDialog: jest.fn(),
  })),
  useMarketplaceIntegration: jest.fn(() => ({
    isAddingAgentsRef: { current: false },
  })),
  useMarketplaceData: jest.fn(),
  useMarketplacePublishing: jest.fn(),
  useTemplateOperations: jest.fn(),
  useOfficialAgentSeeding: jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockApi = api as jest.Mocked<typeof api>

describe('WorkflowBuilder - Additional Coverage', () => {
  const mockOnExecutionStart = jest.fn()
  const mockOnWorkflowSaved = jest.fn()
  const mockOnWorkflowModified = jest.fn()
  const mockOnWorkflowLoaded = jest.fn()
  const mockOnExecutionLogUpdate = jest.fn()
  const mockOnExecutionStatusUpdate = jest.fn()
  const mockOnExecutionNodeUpdate = jest.fn()
  const mockOnRemoveExecution = jest.fn()

  const defaultProps = {
    tabId: 'tab-1',
    workflowId: null,
    tabName: 'Untitled Workflow',
    tabIsUnsaved: false,
    workflowTabs: [],
    onExecutionStart: mockOnExecutionStart,
    onWorkflowSaved: mockOnWorkflowSaved,
    onWorkflowModified: mockOnWorkflowModified,
    onWorkflowLoaded: mockOnWorkflowLoaded,
    onExecutionLogUpdate: mockOnExecutionLogUpdate,
    onExecutionStatusUpdate: mockOnExecutionStatusUpdate,
    onExecutionNodeUpdate: mockOnExecutionNodeUpdate,
    onRemoveExecution: mockOnRemoveExecution,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'testuser' },
      token: 'token',
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    } as any)
    ;(showConfirm as jest.Mock).mockResolvedValue(true)
  })

  describe('Component Rendering', () => {
    it('should render WorkflowBuilder with all child components', async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} />
          </ReactFlowProvider>
        )
      })

      // Wait for child components to render
      await waitFor(() => {
        expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument()
      })
      expect(screen.getByTestId('node-panel')).toBeInTheDocument()
      expect(screen.getByTestId('property-panel')).toBeInTheDocument()
      expect(screen.getByTestId('execution-console')).toBeInTheDocument()
    })

    it('should render with workflowId prop', async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} workflowId="workflow-1" />
          </ReactFlowProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument()
      })
    })

    it('should render with tabIsUnsaved prop', async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} tabIsUnsaved={true} />
          </ReactFlowProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument()
      })
    })
  })

  describe('Imperative Handle', () => {
    it('should expose saveWorkflow method via ref', async () => {
      const ref = React.createRef<WorkflowBuilderHandle>()

      render(
        <ReactFlowProvider>
          <WorkflowBuilder {...defaultProps} ref={ref} />
        </ReactFlowProvider>
      )

      // Wait for component to mount and ref to be set
      await waitFor(() => {
        expect(ref.current).toBeDefined()
        expect(ref.current?.saveWorkflow).toBeDefined()
        expect(typeof ref.current?.saveWorkflow).toBe('function')
      }, { timeout: 3000 })
    })

    it('should expose executeWorkflow method via ref', async () => {
      const ref = React.createRef<WorkflowBuilderHandle>()

      render(
        <ReactFlowProvider>
          <WorkflowBuilder {...defaultProps} ref={ref} />
        </ReactFlowProvider>
      )

      await waitFor(() => {
        expect(ref.current?.executeWorkflow).toBeDefined()
        expect(typeof ref.current?.executeWorkflow).toBe('function')
      }, { timeout: 3000 })
    })

    it('should expose exportWorkflow method via ref', async () => {
      const ref = React.createRef<WorkflowBuilderHandle>()

      render(
        <ReactFlowProvider>
          <WorkflowBuilder {...defaultProps} ref={ref} />
        </ReactFlowProvider>
      )

      await waitFor(() => {
        expect(ref.current?.exportWorkflow).toBeDefined()
        expect(typeof ref.current?.exportWorkflow).toBe('function')
      }, { timeout: 3000 })
    })

    it('should call saveWorkflow when ref method is called', async () => {
      const ref = React.createRef<WorkflowBuilderHandle>()

      render(
        <ReactFlowProvider>
          <WorkflowBuilder {...defaultProps} ref={ref} />
        </ReactFlowProvider>
      )

      await waitFor(() => {
        expect(ref.current?.saveWorkflow).toBeDefined()
      }, { timeout: 3000 })

      if (ref.current?.saveWorkflow) {
        await act(async () => {
          await ref.current!.saveWorkflow()
        })
        // saveWorkflow should be called (mocked to return 'workflow-1')
      }
    })
  })

  describe('Props Handling', () => {
    it('should handle null workflowId', async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} workflowId={null} />
          </ReactFlowProvider>
        )
      })

      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument()
    })

    it('should handle empty tabName', async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} tabName="" />
          </ReactFlowProvider>
        )
      })

      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument()
    })

    it('should handle all callback props', async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} />
          </ReactFlowProvider>
        )
      })

      // Component should render with all callbacks
      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument()
    })
  })

  describe('Dependency Injection', () => {
    it('should accept custom storage adapter', async () => {
      const mockStorage: StorageAdapter = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      }

      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} storage={mockStorage} />
          </ReactFlowProvider>
        )
      })

      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument()
    })

    it('should use default storage adapter when not provided', async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} />
          </ReactFlowProvider>
        )
      })

      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument()
    })
  })

  describe('Hook Integration', () => {
    it('should call useWorkflowState hook', async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} />
          </ReactFlowProvider>
        )
      })

      expect(mockUseWorkflowState).toHaveBeenCalled()
    })

    it('should call useNodeSelection hook', async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} />
          </ReactFlowProvider>
        )
      })

      expect(mockUseNodeSelection).toHaveBeenCalled()
    })

    it('should call useWorkflowPersistence hook', async () => {
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} />
          </ReactFlowProvider>
        )
      })

      expect(mockUseWorkflowPersistence).toHaveBeenCalled()
    })

    it('should call useWorkflowExecution hook', async () => {
      // Domain-based import - Phase 7
      const { useWorkflowExecution } = require('../hooks/execution')
      
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} />
          </ReactFlowProvider>
        )
      })

      expect(mockUseWorkflowExecution).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing callbacks gracefully', async () => {
      const propsWithoutCallbacks = {
        ...defaultProps,
        onExecutionStart: undefined,
        onWorkflowSaved: undefined,
        onWorkflowModified: undefined,
      }

      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...propsWithoutCallbacks} />
          </ReactFlowProvider>
        )
      })

      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument()
    })
  })
})
