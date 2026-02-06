/**
 * Workflow Builder Dialogs Component Tests
 * Tests for dialog component rendering and interactions
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkflowBuilderDialogs } from './WorkflowBuilderDialogs'
import type { Node } from '@xyflow/react'

// Mock child components
jest.mock('../ExecutionInputDialog', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSubmit }: any) => 
    isOpen ? (
      <div data-testid="execution-input-dialog">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSubmit({})}>Submit</button>
      </div>
    ) : null,
}))

jest.mock('../NodeContextMenu', () => ({
  __esModule: true,
  default: ({ onClose, onDelete, onCopy, onCut, onPaste }: any) => (
    <div data-testid="context-menu">
      <button onClick={onClose}>Close</button>
      <button onClick={onDelete}>Delete</button>
      <button onClick={onCopy}>Copy</button>
      <button onClick={onCut}>Cut</button>
      <button onClick={onPaste}>Paste</button>
    </div>
  ),
}))

jest.mock('../MarketplaceDialog', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="marketplace-dialog">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}))

describe('WorkflowBuilderDialogs', () => {
  const mockNode: Node = {
    id: 'node-1',
    type: 'agent',
    position: { x: 0, y: 0 },
    data: { label: 'Test Node' },
  }

  const defaultProps = {
    showInputs: false,
    onCloseInputs: jest.fn(),
    onConfirmExecute: jest.fn(),
    executionNodes: [],
    workflowName: 'Test Workflow',
    contextMenu: null,
    onCloseContextMenu: jest.fn(),
    onDeleteNode: jest.fn(),
    onCopy: jest.fn(),
    onCut: jest.fn(),
    onPaste: jest.fn(),
    onAddToAgentNodes: jest.fn(),
    onSendToMarketplace: jest.fn(),
    canPaste: false,
    showMarketplaceDialog: false,
    onCloseMarketplaceDialog: jest.fn(),
    marketplaceNode: null,
    workflowId: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render dialogs when all are closed', () => {
    render(<WorkflowBuilderDialogs {...defaultProps} />)

    expect(screen.queryByTestId('execution-input-dialog')).not.toBeInTheDocument()
    expect(screen.queryByTestId('context-menu')).not.toBeInTheDocument()
    expect(screen.queryByTestId('marketplace-dialog')).not.toBeInTheDocument()
  })

  it('should render execution input dialog when showInputs is true', () => {
    render(<WorkflowBuilderDialogs {...defaultProps} showInputs={true} />)

    expect(screen.getByTestId('execution-input-dialog')).toBeInTheDocument()
  })

  it('should call onCloseInputs when execution dialog close is clicked', () => {
    render(<WorkflowBuilderDialogs {...defaultProps} showInputs={true} />)

    const closeButton = screen.getByText('Close')
    fireEvent.click(closeButton)

    expect(defaultProps.onCloseInputs).toHaveBeenCalledTimes(1)
  })

  it('should call onConfirmExecute when execution dialog submit is clicked', () => {
    render(<WorkflowBuilderDialogs {...defaultProps} showInputs={true} />)

    const submitButton = screen.getByText('Submit')
    fireEvent.click(submitButton)

    expect(defaultProps.onConfirmExecute).toHaveBeenCalled()
  })

  it('should render context menu when contextMenu is provided', () => {
    const contextMenu = {
      nodeId: 'node-1',
      edgeId: null,
      node: mockNode,
      x: 100,
      y: 200,
    }

    render(<WorkflowBuilderDialogs {...defaultProps} contextMenu={contextMenu} />)

    expect(screen.getByTestId('context-menu')).toBeInTheDocument()
  })

  it('should call onCloseContextMenu when backdrop is clicked', () => {
    const contextMenu = {
      nodeId: 'node-1',
      edgeId: null,
      node: mockNode,
      x: 100,
      y: 200,
    }

    const { container } = render(<WorkflowBuilderDialogs {...defaultProps} contextMenu={contextMenu} />)

    const backdrop = container.querySelector('.fixed.inset-0')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(defaultProps.onCloseContextMenu).toHaveBeenCalledTimes(1)
    }
  })

  it('should call onDeleteNode when context menu delete is clicked', () => {
    const contextMenu = {
      nodeId: 'node-1',
      edgeId: null,
      node: mockNode,
      x: 100,
      y: 200,
    }

    render(<WorkflowBuilderDialogs {...defaultProps} contextMenu={contextMenu} />)

    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    expect(defaultProps.onDeleteNode).toHaveBeenCalledTimes(1)
  })

  it('should render marketplace dialog when showMarketplaceDialog is true', () => {
    render(<WorkflowBuilderDialogs {...defaultProps} showMarketplaceDialog={true} />)

    expect(screen.getByTestId('marketplace-dialog')).toBeInTheDocument()
  })

  it('should call onCloseMarketplaceDialog when marketplace dialog close is clicked', () => {
    render(<WorkflowBuilderDialogs {...defaultProps} showMarketplaceDialog={true} />)

    const closeButton = screen.getByText('Close')
    fireEvent.click(closeButton)

    expect(defaultProps.onCloseMarketplaceDialog).toHaveBeenCalledTimes(1)
  })
})
