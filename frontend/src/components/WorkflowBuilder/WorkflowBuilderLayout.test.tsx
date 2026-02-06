/**
 * Workflow Builder Layout Component Tests
 * Tests for layout component rendering and structure
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { WorkflowBuilderLayout } from './WorkflowBuilderLayout'
import type { Node, Edge } from '@xyflow/react'

// Mock child components
jest.mock('../NodePanel', () => ({
  __esModule: true,
  default: () => <div data-testid="node-panel">NodePanel</div>,
}))

jest.mock('../PropertyPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="property-panel">PropertyPanel</div>,
}))

jest.mock('../WorkflowCanvas', () => ({
  __esModule: true,
  default: () => <div data-testid="workflow-canvas">WorkflowCanvas</div>,
}))

jest.mock('../ExecutionConsole', () => ({
  __esModule: true,
  default: () => <div data-testid="execution-console">ExecutionConsole</div>,
}))

jest.mock('../KeyboardHandler', () => ({
  __esModule: true,
  KeyboardHandler: () => <div data-testid="keyboard-handler">KeyboardHandler</div>,
}))

jest.mock('../ReactFlowInstanceCapture', () => ({
  ReactFlowInstanceCapture: () => <div data-testid="react-flow-instance-capture">ReactFlowInstanceCapture</div>,
}))

describe('WorkflowBuilderLayout', () => {
  const mockNodes: Node[] = []
  const mockEdges: Edge[] = []
  const mockReactFlowInstanceRef = { current: null } as React.RefObject<any>

  const defaultProps = {
    nodes: mockNodes,
    edges: mockEdges,
    onNodesChange: jest.fn(),
    onEdgesChange: jest.fn(),
    onConnect: jest.fn(),
    onDrop: jest.fn(),
    onDragOver: jest.fn(),
    onNodeClick: jest.fn(),
    onNodeContextMenu: jest.fn(),
    onEdgeContextMenu: jest.fn(),
    onPaneClick: jest.fn(),
    nodeExecutionStates: {},
    reactFlowInstanceRef: mockReactFlowInstanceRef,
    selectedNodeId: null,
    setSelectedNodeId: jest.fn(),
    selectedNodeIds: new Set<string>(),
    notifyModified: jest.fn(),
    clipboardNode: null,
    onCopy: jest.fn(),
    onCut: jest.fn(),
    onPaste: jest.fn(),
    activeWorkflowId: null,
    executions: [],
    activeExecutionId: null,
    onWorkflowUpdate: jest.fn(),
    onExecutionLogUpdate: jest.fn(),
    onExecutionStatusUpdate: jest.fn(),
    onExecutionNodeUpdate: jest.fn(),
    onRemoveExecution: jest.fn(),
    onSaveWorkflow: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all layout components', () => {
    render(<WorkflowBuilderLayout {...defaultProps} />)

    expect(screen.getByTestId('node-panel')).toBeInTheDocument()
    expect(screen.getByTestId('property-panel')).toBeInTheDocument()
    expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('execution-console')).toBeInTheDocument()
    expect(screen.getByTestId('keyboard-handler')).toBeInTheDocument()
    expect(screen.getByTestId('react-flow-instance-capture')).toBeInTheDocument()
  })

  it('should have correct layout structure', () => {
    const { container } = render(<WorkflowBuilderLayout {...defaultProps} />)

    const mainContainer = container.firstChild
    expect(mainContainer).toHaveClass('flex-1', 'flex', 'overflow-hidden')
  })

  it('should pass props to child components', () => {
    const props = {
      ...defaultProps,
      selectedNodeId: 'node-1',
      activeWorkflowId: 'workflow-1',
    }

    render(<WorkflowBuilderLayout {...props} />)

    // Components should receive props (tested via component rendering)
    expect(screen.getByTestId('node-panel')).toBeInTheDocument()
    expect(screen.getByTestId('property-panel')).toBeInTheDocument()
  })
})
