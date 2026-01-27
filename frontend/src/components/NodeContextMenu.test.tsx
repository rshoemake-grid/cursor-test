import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import NodeContextMenu from './NodeContextMenu'
import { ReactFlowProvider } from '@xyflow/react'

// Mock useReactFlow
jest.mock('@xyflow/react', () => ({
  ...jest.requireActual('@xyflow/react'),
  useReactFlow: () => ({
    deleteElements: jest.fn(),
  }),
}))

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ReactFlowProvider>
      {component}
    </ReactFlowProvider>
  )
}

describe('NodeContextMenu', () => {
  const mockOnClose = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnCopy = jest.fn()
  const mockOnCut = jest.fn()
  const mockOnPaste = jest.fn()
  const mockOnAddToAgentNodes = jest.fn()
  const mockOnSendToMarketplace = jest.fn()

  const mockNode = {
    id: 'node-1',
    type: 'agent',
    data: { label: 'Test Node' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render delete button for node', () => {
    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={mockNode}
        x={100}
        y={200}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('Delete Node')).toBeInTheDocument()
  })

  it('should render delete button for edge', () => {
    renderWithProvider(
      <NodeContextMenu
        edgeId="edge-1"
        x={100}
        y={200}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('Delete Connection')).toBeInTheDocument()
  })

  it('should render copy and cut buttons for node', () => {
    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={mockNode}
        x={100}
        y={200}
        onClose={mockOnClose}
        onCopy={mockOnCopy}
        onCut={mockOnCut}
      />
    )

    expect(screen.getByText('Copy')).toBeInTheDocument()
    expect(screen.getByText('Cut')).toBeInTheDocument()
  })

  it('should render paste button when canPaste is true', () => {
    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={mockNode}
        x={100}
        y={200}
        onClose={mockOnClose}
        onPaste={mockOnPaste}
        canPaste={true}
      />
    )

    expect(screen.getByText('Paste')).toBeInTheDocument()
  })

  it('should not render paste button when canPaste is false', () => {
    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={mockNode}
        x={100}
        y={200}
        onClose={mockOnClose}
        onPaste={mockOnPaste}
        canPaste={false}
      />
    )

    expect(screen.queryByText('Paste')).not.toBeInTheDocument()
  })

  it('should render agent-specific buttons for agent node', () => {
    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={mockNode}
        x={100}
        y={200}
        onClose={mockOnClose}
        onAddToAgentNodes={mockOnAddToAgentNodes}
        onSendToMarketplace={mockOnSendToMarketplace}
      />
    )

    expect(screen.getByText('Add to Agent Nodes')).toBeInTheDocument()
    expect(screen.getByText('Send to Marketplace')).toBeInTheDocument()
  })

  it('should not render agent-specific buttons for non-agent node', () => {
    const nonAgentNode = {
      id: 'node-1',
      type: 'start',
      data: { label: 'Start Node' },
    }

    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={nonAgentNode}
        x={100}
        y={200}
        onClose={mockOnClose}
        onAddToAgentNodes={mockOnAddToAgentNodes}
        onSendToMarketplace={mockOnSendToMarketplace}
      />
    )

    expect(screen.queryByText('Add to Agent Nodes')).not.toBeInTheDocument()
    expect(screen.queryByText('Send to Marketplace')).not.toBeInTheDocument()
  })

  it('should call onCopy when copy button is clicked', () => {
    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={mockNode}
        x={100}
        y={200}
        onClose={mockOnClose}
        onCopy={mockOnCopy}
      />
    )

    const copyButton = screen.getByText('Copy')
    fireEvent.click(copyButton)

    expect(mockOnCopy).toHaveBeenCalledWith(mockNode)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onCut when cut button is clicked', () => {
    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={mockNode}
        x={100}
        y={200}
        onClose={mockOnClose}
        onCut={mockOnCut}
      />
    )

    const cutButton = screen.getByText('Cut')
    fireEvent.click(cutButton)

    expect(mockOnCut).toHaveBeenCalledWith(mockNode)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onPaste when paste button is clicked', () => {
    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={mockNode}
        x={100}
        y={200}
        onClose={mockOnClose}
        onPaste={mockOnPaste}
        canPaste={true}
      />
    )

    const pasteButton = screen.getByText('Paste')
    fireEvent.click(pasteButton)

    expect(mockOnPaste).toHaveBeenCalledTimes(1)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onAddToAgentNodes when button is clicked', () => {
    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={mockNode}
        x={100}
        y={200}
        onClose={mockOnClose}
        onAddToAgentNodes={mockOnAddToAgentNodes}
      />
    )

    const addButton = screen.getByText('Add to Agent Nodes')
    fireEvent.click(addButton)

    expect(mockOnAddToAgentNodes).toHaveBeenCalledWith(mockNode)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onSendToMarketplace when button is clicked', () => {
    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={mockNode}
        x={100}
        y={200}
        onClose={mockOnClose}
        onSendToMarketplace={mockOnSendToMarketplace}
      />
    )

    const marketplaceButton = screen.getByText('Send to Marketplace')
    fireEvent.click(marketplaceButton)

    expect(mockOnSendToMarketplace).toHaveBeenCalledWith(mockNode)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onDelete when delete button is clicked for node', () => {
    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={mockNode}
        x={100}
        y={200}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )

    const deleteButton = screen.getByText('Delete Node')
    fireEvent.click(deleteButton)

    expect(mockOnDelete).toHaveBeenCalledTimes(1)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onDelete when delete button is clicked for edge', () => {
    renderWithProvider(
      <NodeContextMenu
        edgeId="edge-1"
        x={100}
        y={200}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )

    const deleteButton = screen.getByText('Delete Connection')
    fireEvent.click(deleteButton)

    expect(mockOnDelete).toHaveBeenCalledTimes(1)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should position menu at specified coordinates', () => {
    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={mockNode}
        x={150}
        y={250}
        onClose={mockOnClose}
      />
    )

    const menu = screen.getByText('Delete Node').closest('div')
    expect(menu).toHaveStyle({ left: '150px', top: '250px' })
  })

  it('should stop propagation on click', () => {
    const handleParentClick = jest.fn()
    
    renderWithProvider(
      <div onClick={handleParentClick}>
        <NodeContextMenu
          nodeId="node-1"
          node={mockNode}
          x={100}
          y={200}
          onClose={mockOnClose}
        />
      </div>
    )

    const menu = screen.getByText('Delete Node').closest('div')
    fireEvent.click(menu!)

    // Parent click handler should not be called due to stopPropagation
    expect(handleParentClick).not.toHaveBeenCalled()
  })

  it('should handle copy when node is null', () => {
    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={null}
        x={100}
        y={200}
        onClose={mockOnClose}
        onCopy={mockOnCopy}
      />
    )

    const copyButton = screen.getByText('Copy')
    fireEvent.click(copyButton)

    // Should not call onCopy when node is null
    expect(mockOnCopy).not.toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should handle copy when callback is not provided', () => {
    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={mockNode}
        x={100}
        y={200}
        onClose={mockOnClose}
      />
    )

    const copyButton = screen.getByText('Copy')
    fireEvent.click(copyButton)

    // Should not crash, just close
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should handle cut when node is null', () => {
    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={null}
        x={100}
        y={200}
        onClose={mockOnClose}
        onCut={mockOnCut}
      />
    )

    const cutButton = screen.getByText('Cut')
    fireEvent.click(cutButton)

    // Should not call onCut when node is null
    expect(mockOnCut).not.toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should handle paste when callback is not provided', () => {
    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={mockNode}
        x={100}
        y={200}
        onClose={mockOnClose}
        canPaste={true}
      />
    )

    const pasteButton = screen.getByText('Paste')
    fireEvent.click(pasteButton)

    // Should not crash, just close
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should handle addToAgentNodes when node is null', () => {
    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={null}
        x={100}
        y={200}
        onClose={mockOnClose}
        onAddToAgentNodes={mockOnAddToAgentNodes}
      />
    )

    // Add to Agent Nodes button should not be visible for non-agent nodes
    expect(screen.queryByText('Add to Agent Nodes')).not.toBeInTheDocument()
  })

  it('should handle sendToMarketplace when node is null', () => {
    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={null}
        x={100}
        y={200}
        onClose={mockOnClose}
        onSendToMarketplace={mockOnSendToMarketplace}
      />
    )

    // Send to Marketplace button should not be visible for non-agent nodes
    expect(screen.queryByText('Send to Marketplace')).not.toBeInTheDocument()
  })

  it('should handle delete when both nodeId and edgeId are provided', () => {
    const mockDeleteElements = jest.fn()
    jest.spyOn(require('@xyflow/react'), 'useReactFlow').mockReturnValue({
      deleteElements: mockDeleteElements,
    })

    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        edgeId="edge-1"
        node={mockNode}
        x={100}
        y={200}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )

    const deleteButton = screen.getByText('Delete Node')
    fireEvent.click(deleteButton)

    // Should delete node (nodeId takes precedence)
    expect(mockDeleteElements).toHaveBeenCalledWith({ nodes: [{ id: 'node-1' }] })
    expect(mockOnDelete).toHaveBeenCalledTimes(1)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should handle delete when neither nodeId nor edgeId are provided', () => {
    const mockDeleteElements = jest.fn()
    jest.spyOn(require('@xyflow/react'), 'useReactFlow').mockReturnValue({
      deleteElements: mockDeleteElements,
    })

    renderWithProvider(
      <NodeContextMenu
        x={100}
        y={200}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )

    const deleteButton = screen.getByText('Delete Connection')
    fireEvent.click(deleteButton)

    // Should not call deleteElements when neither nodeId nor edgeId
    expect(mockDeleteElements).not.toHaveBeenCalled()
    expect(mockOnDelete).toHaveBeenCalledTimes(1)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should handle non-agent node type', () => {
    const nonAgentNode = {
      id: 'node-1',
      type: 'condition',
      data: { label: 'Condition Node' },
    }

    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={nonAgentNode}
        x={100}
        y={200}
        onClose={mockOnClose}
        onAddToAgentNodes={mockOnAddToAgentNodes}
        onSendToMarketplace={mockOnSendToMarketplace}
      />
    )

    // Agent-specific buttons should not be visible
    expect(screen.queryByText('Add to Agent Nodes')).not.toBeInTheDocument()
    expect(screen.queryByText('Send to Marketplace')).not.toBeInTheDocument()
  })

  it('should handle delete without onDelete callback', () => {
    const mockDeleteElements = jest.fn()
    jest.spyOn(require('@xyflow/react'), 'useReactFlow').mockReturnValue({
      deleteElements: mockDeleteElements,
    })

    renderWithProvider(
      <NodeContextMenu
        nodeId="node-1"
        node={mockNode}
        x={100}
        y={200}
        onClose={mockOnClose}
      />
    )

    const deleteButton = screen.getByText('Delete Node')
    fireEvent.click(deleteButton)

    // Should still delete and close
    expect(mockDeleteElements).toHaveBeenCalledWith({ nodes: [{ id: 'node-1' }] })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})
