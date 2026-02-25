/**
 * Tests for ExecutionListItem Component
 * Follows SOLID, DRY, and DIP principles
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ExecutionListItem from './ExecutionListItem'
import type { ExecutionState } from '../../types/workflow'

describe('ExecutionListItem', () => {
  const mockExecution: ExecutionState = {
    execution_id: 'exec-12345678',
    workflow_id: 'workflow-12345678',
    status: 'completed',
    started_at: '2024-01-01T10:00:00Z',
    completed_at: '2024-01-01T10:00:05Z',
    node_states: {},
    variables: {},
    logs: [],
  }

  const mockOnExecutionClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render execution details', () => {
    render(
      <ExecutionListItem
        execution={mockExecution}
        onExecutionClick={mockOnExecutionClick}
      />
    )

    // Execution ID is sliced to 8 chars: "exec-1234..."
    expect(screen.getByText(/exec-123/)).toBeInTheDocument()
    // Workflow text is split: "Workflow: workflow..."
    expect(screen.getByText(/Workflow:/)).toBeInTheDocument()
    expect(screen.getByText('View')).toBeInTheDocument()
  })

  it('should call onExecutionClick when item is clicked', () => {
    const { container } = render(
      <ExecutionListItem
        execution={mockExecution}
        onExecutionClick={mockOnExecutionClick}
      />
    )

    const item = container.querySelector('div[class*="cursor-pointer"]')
    if (item) {
      fireEvent.click(item)
      expect(mockOnExecutionClick).toHaveBeenCalledWith('exec-12345678')
    } else {
      // Fallback: click on the execution ID text
      const executionId = screen.getByText(/exec-123/)
      fireEvent.click(executionId.closest('div') || executionId)
      expect(mockOnExecutionClick).toHaveBeenCalledWith('exec-12345678')
    }
  })

  it('should call onExecutionClick when View button is clicked', () => {
    render(
      <ExecutionListItem
        execution={mockExecution}
        onExecutionClick={mockOnExecutionClick}
      />
    )

    const viewButton = screen.getByText('View')
    fireEvent.click(viewButton)

    expect(mockOnExecutionClick).toHaveBeenCalledWith('exec-12345678')
  })

  it('should display current node when present', () => {
    const executionWithNode: ExecutionState = {
      ...mockExecution,
      current_node: 'node-1',
    }

    render(
      <ExecutionListItem
        execution={executionWithNode}
        onExecutionClick={mockOnExecutionClick}
      />
    )

    expect(screen.getByText('Current Node:')).toBeInTheDocument()
    expect(screen.getByText('node-1')).toBeInTheDocument()
  })

  it('should display progress bar for running executions', () => {
    const runningExecution: ExecutionState = {
      ...mockExecution,
      status: 'running',
      completed_at: undefined,
      node_states: {
        node1: { status: 'completed' },
        node2: { status: 'running' },
        node3: { status: 'pending' },
      },
    }

    render(
      <ExecutionListItem
        execution={runningExecution}
        onExecutionClick={mockOnExecutionClick}
      />
    )

    expect(screen.getByText('Progress:')).toBeInTheDocument()
  })

  it('should not display progress bar for non-running executions', () => {
    render(
      <ExecutionListItem
        execution={mockExecution}
        onExecutionClick={mockOnExecutionClick}
      />
    )

    expect(screen.queryByText('Progress:')).not.toBeInTheDocument()
  })

  it('should display completed timestamp when present', () => {
    render(
      <ExecutionListItem
        execution={mockExecution}
        onExecutionClick={mockOnExecutionClick}
      />
    )

    expect(screen.getByText(/Completed:/)).toBeInTheDocument()
  })

  it('should not display completed timestamp when absent', () => {
    const executionWithoutCompletion: ExecutionState = {
      ...mockExecution,
      completed_at: undefined,
    }

    render(
      <ExecutionListItem
        execution={executionWithoutCompletion}
        onExecutionClick={mockOnExecutionClick}
      />
    )

    expect(screen.queryByText(/Completed:/)).not.toBeInTheDocument()
  })

  it('should display duration', () => {
    render(
      <ExecutionListItem
        execution={mockExecution}
        onExecutionClick={mockOnExecutionClick}
      />
    )

    expect(screen.getByText(/Duration:/)).toBeInTheDocument()
  })

  it('should apply active styling for running execution', () => {
    const runningExecution: ExecutionState = {
      ...mockExecution,
      status: 'running',
    }

    const { container } = render(
      <ExecutionListItem
        execution={runningExecution}
        onExecutionClick={mockOnExecutionClick}
      />
    )

    const item = container.querySelector('.border-blue-500')
    expect(item).toBeInTheDocument()
  })

  it('should apply active styling for pending execution', () => {
    const pendingExecution: ExecutionState = {
      ...mockExecution,
      status: 'pending',
    }

    const { container } = render(
      <ExecutionListItem
        execution={pendingExecution}
        onExecutionClick={mockOnExecutionClick}
      />
    )

    const item = container.querySelector('.border-blue-500')
    expect(item).toBeInTheDocument()
  })

  it('should apply inactive styling for completed execution', () => {
    const { container } = render(
      <ExecutionListItem
        execution={mockExecution}
        onExecutionClick={mockOnExecutionClick}
      />
    )

    const item = container.querySelector('.border-gray-200')
    expect(item).toBeInTheDocument()
  })
})
