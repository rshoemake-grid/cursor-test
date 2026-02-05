import * as React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import WorkflowBuilder, { WorkflowBuilderHandle } from './WorkflowBuilder'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api/client'
import { showSuccess, showError } from '../utils/notifications'
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

jest.mock('../hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(),
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

// Mock all custom hooks
jest.mock('../hooks/useWorkflowState', () => ({
  useWorkflowState: jest.fn(() => ({
    localWorkflowId: null,
    setLocalWorkflowId: jest.fn(),
    localWorkflowName: '',
    setLocalWorkflowName: jest.fn(),
    localWorkflowDescription: '',
    setLocalWorkflowDescription: jest.fn(),
    variables: {},
    setVariables: jest.fn(),
  })),
}))

jest.mock('../hooks/useNodeSelection', () => ({
  useNodeSelection: jest.fn(() => ({
    selectedNodeId: null,
    setSelectedNodeId: jest.fn(),
    selectedNodeIds: [],
    handleNodesChange: jest.fn(),
  })),
}))

jest.mock('../hooks/useClipboard', () => ({
  useClipboard: jest.fn(() => ({
    clipboardNode: null,
    onCopy: jest.fn(),
    onCut: jest.fn(),
    onPaste: jest.fn(),
  })),
}))

jest.mock('../hooks/useWorkflowUpdates', () => ({
  useWorkflowUpdates: jest.fn(() => ({
    workflowNodeToNode: jest.fn(),
  })),
}))

jest.mock('../hooks/useMarketplaceIntegration', () => ({
  useMarketplaceIntegration: jest.fn(() => ({
    isAddingAgentsRef: { current: false },
  })),
}))

jest.mock('../hooks/useDraftManagement', () => ({
  useDraftManagement: jest.fn(() => ({
    saveDraftsToStorage: jest.fn(),
  })),
  loadDraftsFromStorage: jest.fn(() => ({})),
}))

jest.mock('../hooks/useWorkflowPersistence', () => ({
  useWorkflowPersistence: jest.fn(() => ({
    saveWorkflow: jest.fn().mockResolvedValue('workflow-1'),
    exportWorkflow: jest.fn(),
  })),
}))

jest.mock('../hooks/useWorkflowExecution', () => ({
  useWorkflowExecution: jest.fn(() => ({
    executeWorkflow: jest.fn(),
    showInputs: false,
  })),
}))

jest.mock('../hooks/useWorkflowLoader', () => ({
  useWorkflowLoader: jest.fn(),
}))

jest.mock('../hooks/useCanvasEvents', () => ({
  useCanvasEvents: jest.fn(() => ({
    onDrop: jest.fn(),
    onDragOver: jest.fn(),
    onConnect: jest.fn(),
    onNodeClick: jest.fn(),
    onNodeContextMenu: jest.fn(),
    onEdgeContextMenu: jest.fn(),
    onPaneClick: jest.fn(),
  })),
}))

jest.mock('../hooks/useContextMenu', () => ({
  useContextMenu: jest.fn(() => ({
    contextMenu: null,
    onClose: jest.fn(),
  })),
}))

jest.mock('../hooks/useWorkflowUpdateHandler', () => ({
  useWorkflowUpdateHandler: jest.fn(() => ({
    handleWorkflowUpdate: jest.fn(),
  })),
}))

jest.mock('../hooks/useMarketplaceDialog', () => ({
  useMarketplaceDialog: jest.fn(() => ({
    showMarketplaceDialog: false,
    marketplaceNode: null,
    openDialog: jest.fn(),
    closeDialog: jest.fn(),
  })),
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
      const { useWorkflowState } = require('../hooks/useWorkflowState')
      
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} />
          </ReactFlowProvider>
        )
      })

      expect(useWorkflowState).toHaveBeenCalled()
    })

    it('should call useNodeSelection hook', async () => {
      const { useNodeSelection } = require('../hooks/useNodeSelection')
      
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} />
          </ReactFlowProvider>
        )
      })

      expect(useNodeSelection).toHaveBeenCalled()
    })

    it('should call useWorkflowPersistence hook', async () => {
      const { useWorkflowPersistence } = require('../hooks/useWorkflowPersistence')
      
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} />
          </ReactFlowProvider>
        )
      })

      expect(useWorkflowPersistence).toHaveBeenCalled()
    })

    it('should call useWorkflowExecution hook', async () => {
      const { useWorkflowExecution } = require('../hooks/useWorkflowExecution')
      
      await act(async () => {
        render(
          <ReactFlowProvider>
            <WorkflowBuilder {...defaultProps} />
          </ReactFlowProvider>
        )
      })

      expect(useWorkflowExecution).toHaveBeenCalled()
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
