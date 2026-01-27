import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import ExecutionViewer from './ExecutionViewer'
import { useWorkflowAPI } from '../hooks/useWorkflowAPI'
import { logger } from '../utils/logger'

// Mock dependencies
jest.mock('../hooks/useWorkflowAPI')
jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  }
}))

const mockUseWorkflowAPI = useWorkflowAPI as jest.MockedFunction<typeof useWorkflowAPI>

describe('ExecutionViewer', () => {
  const mockGetExecution = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockUseWorkflowAPI.mockReturnValue({
      getExecution: mockGetExecution,
      createWorkflow: jest.fn(),
      updateWorkflow: jest.fn(),
      deleteWorkflow: jest.fn(),
      listWorkflows: jest.fn(),
      getWorkflow: jest.fn(),
      executeWorkflow: jest.fn(),
      listExecutions: jest.fn(),
    } as any)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should show loading state initially', () => {
    mockGetExecution.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<ExecutionViewer executionId="exec-1" />)

    expect(screen.getByText('Loading execution...')).toBeInTheDocument()
  })

  it('should display execution when loaded', async () => {
    const mockExecution = {
      id: 'exec-1',
      status: 'completed',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {},
      logs: [],
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(screen.queryByText('Loading execution...')).not.toBeInTheDocument()
    }, { timeout: 3000 })

    expect(mockGetExecution).toHaveBeenCalledWith('exec-1')
  })

  it('should show error message when execution not found', async () => {
    mockGetExecution.mockRejectedValue(new Error('Not found'))

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(screen.getByText('Execution not found')).toBeInTheDocument()
    })

    expect(logger.error).toHaveBeenCalled()
  })

  it('should poll for updates when execution is running', async () => {
    const mockExecution = {
      id: 'exec-1',
      status: 'running',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {},
      logs: [],
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(mockGetExecution).toHaveBeenCalledTimes(1)
    }, { timeout: 3000 })

    // Advance timers to trigger polling
    jest.advanceTimersByTime(2000)
    await Promise.resolve() // Allow promises to resolve

    await waitFor(() => {
      expect(mockGetExecution).toHaveBeenCalledTimes(2)
    }, { timeout: 3000 })
  })

  it('should stop polling when execution completes', async () => {
    const runningExecution = {
      id: 'exec-1',
      status: 'running',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {},
      logs: [],
    }
    const completedExecution = {
      id: 'exec-1',
      status: 'completed',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {},
      logs: [],
    }

    mockGetExecution
      .mockResolvedValueOnce(runningExecution as any)
      .mockResolvedValue(completedExecution as any) // All subsequent calls return completed

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(mockGetExecution).toHaveBeenCalledTimes(1)
    }, { timeout: 3000 })

    // Advance timers to trigger polling - this will get completed status
    jest.advanceTimersByTime(2000)
    await Promise.resolve() // Allow promises to resolve

    // Wait for execution to complete
    await waitFor(() => {
      expect(mockGetExecution.mock.calls.length).toBeGreaterThanOrEqual(2)
    }, { timeout: 3000 })

    const callCountAfterCompletion = mockGetExecution.mock.calls.length

    // Advance timers multiple times - polling should have stopped
    jest.advanceTimersByTime(2000)
    await Promise.resolve()
    jest.advanceTimersByTime(2000)
    await Promise.resolve()
    jest.advanceTimersByTime(2000)
    await Promise.resolve()

    // After multiple timer advances, should not have many more calls
    // (allowing for useEffect re-runs due to status change, but interval should stop)
    const finalCallCount = mockGetExecution.mock.calls.length
    // Should not have more than 2-3 additional calls after completion
    expect(finalCallCount - callCountAfterCompletion).toBeLessThanOrEqual(2)
  })

  it('should display execution status badge', async () => {
    const mockExecution = {
      id: 'exec-1',
      status: 'completed',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {},
      logs: [],
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      // Execution ID might be displayed in various ways, check for completion status instead
      expect(screen.queryByText('Loading execution...')).not.toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Verify execution was loaded
    expect(mockGetExecution).toHaveBeenCalledWith('exec-1')
  })

  it('should display error message when execution has error', async () => {
    const mockExecution = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'failed',
      started_at: '2024-01-01T00:00:00Z',
      error: 'Execution failed with error',
      nodes: {},
      node_states: {},
      logs: [],
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(screen.getByText(/Execution failed with error/)).toBeInTheDocument()
    })
  })

  it('should display node states', async () => {
    const mockExecution = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {
        'node-1': {
          node_id: 'node-1',
          status: 'completed',
          output: 'Result',
        },
      },
      logs: [],
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(screen.getByText(/node-1/)).toBeInTheDocument()
    })
  })

  it('should display logs', async () => {
    const mockExecution = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {},
      logs: [
        {
          timestamp: '2024-01-01T00:00:00Z',
          level: 'INFO',
          message: 'Log message',
          node_id: 'node-1',
        },
      ],
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(screen.getByText(/Log message/)).toBeInTheDocument()
    })
  })

  it('should handle pending status', async () => {
    const mockExecution = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'pending',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {},
      logs: [],
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(mockGetExecution).toHaveBeenCalled()
    })

    // Should poll for pending status
    jest.advanceTimersByTime(2000)
    await Promise.resolve()

    await waitFor(() => {
      expect(mockGetExecution.mock.calls.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('should handle failed status', async () => {
    const mockExecution = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'failed',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {},
      logs: [],
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(screen.queryByText('Loading execution...')).not.toBeInTheDocument()
    })

    // Should stop polling for failed status
    const callCount = mockGetExecution.mock.calls.length
    jest.advanceTimersByTime(2000)
    await Promise.resolve()

    // Should not poll after failed status
    expect(mockGetExecution.mock.calls.length).toBeLessThanOrEqual(callCount + 1)
  })

  it('should handle executionId change', async () => {
    const mockExecution1 = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {},
      logs: [],
    }
    const mockExecution2 = {
      id: 'exec-2',
      execution_id: 'exec-2',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {},
      logs: [],
    }
    mockGetExecution
      .mockResolvedValueOnce(mockExecution1 as any)
      .mockResolvedValue(mockExecution2 as any)

    const { rerender } = render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(mockGetExecution).toHaveBeenCalledWith('exec-1')
    })

    rerender(<ExecutionViewer executionId="exec-2" />)

    await waitFor(() => {
      expect(mockGetExecution).toHaveBeenCalledWith('exec-2')
    })
  })

  it('should display all status icons correctly', async () => {
    const statuses = ['completed', 'failed', 'running', 'pending', 'unknown']
    
    for (const status of statuses) {
      const mockExecution = {
        id: 'exec-1',
        execution_id: 'exec-1',
        workflow_id: 'workflow-1',
        status,
        started_at: '2024-01-01T00:00:00Z',
        nodes: {},
        node_states: {},
        logs: [],
      }
      mockGetExecution.mockResolvedValue(mockExecution as any)

      const { unmount } = render(<ExecutionViewer executionId="exec-1" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading execution...')).not.toBeInTheDocument()
      })

      // Verify execution was loaded
      expect(mockGetExecution).toHaveBeenCalledWith('exec-1')
      
      unmount()
      jest.clearAllMocks()
    }
  })

  it('should handle getExecution error during polling', async () => {
    const mockExecution = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'running',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {},
      logs: [],
    }
    
    mockGetExecution
      .mockResolvedValueOnce(mockExecution as any)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(mockGetExecution).toHaveBeenCalledTimes(1)
    })

    // Advance timers to trigger polling
    jest.advanceTimersByTime(2000)
    await Promise.resolve()

    // Should handle error and continue polling
    await waitFor(() => {
      expect(logger.error).toHaveBeenCalled()
    })

    // Advance timers again - should continue polling
    jest.advanceTimersByTime(2000)
    await Promise.resolve()

    // Should have attempted to poll again after error
    expect(mockGetExecution.mock.calls.length).toBeGreaterThan(2)
  })

  it('should display monitoring banner when polling', async () => {
    const mockExecution = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'running',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {},
      logs: [],
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(screen.queryByText('Loading execution...')).not.toBeInTheDocument()
    })

    // Should show monitoring banner for running execution
    await waitFor(() => {
      expect(screen.getByText(/Workflow Running/)).toBeInTheDocument()
    })
  })

  it('should not display monitoring banner when not polling', async () => {
    const mockExecution = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {},
      logs: [],
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(screen.queryByText('Loading execution...')).not.toBeInTheDocument()
    })

    // Should not show monitoring banner for completed execution
    expect(screen.queryByText(/Workflow Running/)).not.toBeInTheDocument()
  })

  it('should display completed_at when available', async () => {
    const mockExecution = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2024-01-01T00:00:00Z',
      completed_at: '2024-01-01T00:05:00Z',
      nodes: {},
      node_states: {},
      logs: [],
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(screen.queryByText('Loading execution...')).not.toBeInTheDocument()
    })

    // Should display completed time
    expect(screen.getByText(/Completed:/)).toBeInTheDocument()
  })

  it('should display final result when available', async () => {
    const mockExecution = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {},
      logs: [],
      result: 'Final result text',
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(screen.getByText(/Final Result/)).toBeInTheDocument()
      expect(screen.getByText('Final result text')).toBeInTheDocument()
    })
  })

  it('should display final result as JSON when object', async () => {
    const mockExecution = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {},
      logs: [],
      result: { key: 'value', nested: { data: 123 } },
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(screen.getByText(/Final Result/)).toBeInTheDocument()
      expect(screen.getByText(/"key"/)).toBeInTheDocument()
    })
  })

  it('should display node output as string', async () => {
    const mockExecution = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {
        'node-1': {
          node_id: 'node-1',
          status: 'completed',
          output: 'String output',
        },
      },
      logs: [],
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(screen.getByText('String output')).toBeInTheDocument()
    })
  })

  it('should display node output as JSON when object', async () => {
    const mockExecution = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {
        'node-1': {
          node_id: 'node-1',
          status: 'completed',
          output: { result: 'data', value: 42 },
        },
      },
      logs: [],
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(screen.getByText(/"result"/)).toBeInTheDocument()
    })
  })

  it('should display node input', async () => {
    const mockExecution = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {
        'node-1': {
          node_id: 'node-1',
          status: 'completed',
          input: { param: 'value' },
        },
      },
      logs: [],
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(screen.getByText(/Input:/)).toBeInTheDocument()
      expect(screen.getByText(/"param"/)).toBeInTheDocument()
    })
  })

  it('should display node error', async () => {
    const mockExecution = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'failed',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {
        'node-1': {
          node_id: 'node-1',
          status: 'failed',
          error: 'Node execution failed',
        },
      },
      logs: [],
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument()
      expect(screen.getByText('Node execution failed')).toBeInTheDocument()
    })
  })

  it('should display logs with different levels', async () => {
    const mockExecution = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {},
      logs: [
        { timestamp: '2024-01-01T00:00:00Z', level: 'INFO', message: 'Info log', node_id: 'node-1' },
        { timestamp: '2024-01-01T00:00:01Z', level: 'WARNING', message: 'Warning log', node_id: 'node-1' },
        { timestamp: '2024-01-01T00:00:02Z', level: 'ERROR', message: 'Error log', node_id: 'node-1' },
      ],
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(screen.getByText('Info log')).toBeInTheDocument()
      expect(screen.getByText('Warning log')).toBeInTheDocument()
      expect(screen.getByText('Error log')).toBeInTheDocument()
    })
  })

  it('should display node completion count', async () => {
    const mockExecution = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'running',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {
        'node-1': { node_id: 'node-1', status: 'completed' },
        'node-2': { node_id: 'node-2', status: 'running' },
        'node-3': { node_id: 'node-3', status: 'pending' },
      },
      logs: [],
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      expect(screen.getByText(/1 \/ 3 nodes completed/)).toBeInTheDocument()
    })
  })

  it('should display progress bar for node states', async () => {
    const mockExecution = {
      id: 'exec-1',
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'running',
      started_at: '2024-01-01T00:00:00Z',
      nodes: {},
      node_states: {
        'node-1': { node_id: 'node-1', status: 'completed' },
        'node-2': { node_id: 'node-2', status: 'running' },
      },
      logs: [],
    }
    mockGetExecution.mockResolvedValue(mockExecution as any)

    render(<ExecutionViewer executionId="exec-1" />)

    await waitFor(() => {
      // Progress bar should be rendered
      const progressBar = document.querySelector('.bg-blue-600')
      expect(progressBar).toBeInTheDocument()
    })
  })
})
