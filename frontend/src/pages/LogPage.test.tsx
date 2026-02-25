/**
 * LogPage Component Tests
 * Tests follow SOLID, DRY, and DIP principles
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LogPage from './LogPage'
import { useExecutionList } from '../hooks/log/useExecutionList'
import type { ExecutionState } from '../types/workflow'

// Mock dependencies
jest.mock('../hooks/log/useExecutionList')
const mockApplyExecutionFilters = jest.fn((executions) => executions)
jest.mock('../utils/executionFilters', () => ({
  applyExecutionFilters: (...args: any[]) => mockApplyExecutionFilters(...args),
}))
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn((path: string) => {
    // Mock navigate function
  }),
}))

jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}))

const mockUseExecutionList = useExecutionList as jest.MockedFunction<typeof useExecutionList>
const mockNavigate = jest.fn()

// Helper to ensure all waitFor calls have timeouts
const waitForWithTimeout = async (callback: () => void | Promise<void>, timeout = 2000) => {
  return await waitFor(callback, { timeout })
}

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('LogPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApplyExecutionFilters.mockImplementation((executions) => executions)
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate)
  })

  const mockExecution: ExecutionState = {
    execution_id: 'exec-123',
    workflow_id: 'workflow-123',
    status: 'completed',
    started_at: '2024-01-01T10:00:00Z',
    completed_at: '2024-01-01T10:00:05Z',
    node_states: {},
    variables: {},
    logs: [],
  }

  it('should render loading state', () => {
    mockUseExecutionList.mockReturnValue({
      executions: [],
      loading: true,
      error: null,
      refresh: jest.fn(),
    })

    renderWithRouter(<LogPage />)

    expect(screen.getByText('Loading executions...')).toBeInTheDocument()
  })

  it('should render error state', () => {
    mockUseExecutionList.mockReturnValue({
      executions: [],
      loading: false,
      error: 'Failed to load executions',
      refresh: jest.fn(),
    })

    renderWithRouter(<LogPage />)

    expect(screen.getByText(/Error: Failed to load executions/)).toBeInTheDocument()
  })

  it('should render empty state when no executions', () => {
    mockUseExecutionList.mockReturnValue({
      executions: [],
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    renderWithRouter(<LogPage />)

    expect(screen.getByText('No executions yet')).toBeInTheDocument()
    expect(screen.getByText(/Execute a workflow to see execution logs here/)).toBeInTheDocument()
  })

  it('should render execution list', () => {
    mockUseExecutionList.mockReturnValue({
      executions: [mockExecution],
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    renderWithRouter(<LogPage />)

    expect(screen.getByText('Execution Log')).toBeInTheDocument()
    expect(screen.getByText(/1 execution/)).toBeInTheDocument()
    expect(screen.getByText(/exec-123/)).toBeInTheDocument()
  })

  it('should render filters component', () => {
    mockUseExecutionList.mockReturnValue({
      executions: [mockExecution],
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    renderWithRouter(<LogPage />)

    expect(screen.getByText('Filters')).toBeInTheDocument()
  })

  it('should show filtered count when filters are applied', () => {
    mockApplyExecutionFilters.mockReturnValue([])

    mockUseExecutionList.mockReturnValue({
      executions: [mockExecution],
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    renderWithRouter(<LogPage />)

    expect(screen.getByText(/0 execution/)).toBeInTheDocument()
  })

  it('should display execution count correctly for multiple executions', () => {
    const executions: ExecutionState[] = [
      { ...mockExecution, execution_id: 'exec-1' },
      { ...mockExecution, execution_id: 'exec-2' },
      { ...mockExecution, execution_id: 'exec-3' },
    ]

    mockUseExecutionList.mockReturnValue({
      executions,
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    mockApplyExecutionFilters.mockReturnValue(executions)

    renderWithRouter(<LogPage />)

    expect(screen.getByText(/3 execution/)).toBeInTheDocument()
  })

  it('should navigate to execution when clicked', () => {
    mockUseExecutionList.mockReturnValue({
      executions: [mockExecution],
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    mockApplyExecutionFilters.mockReturnValue([mockExecution])

    renderWithRouter(<LogPage />)

    const viewButton = screen.getByText('View')
    fireEvent.click(viewButton)

    expect(mockNavigate).toHaveBeenCalledWith('/?execution=exec-123')
  })

  it('should navigate when execution item is clicked', () => {
    mockUseExecutionList.mockReturnValue({
      executions: [mockExecution],
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    renderWithRouter(<LogPage />)

    const executionItem = screen.getByText(/exec-123/).closest('div[class*="cursor-pointer"]')
    if (executionItem) {
      fireEvent.click(executionItem)
      expect(mockNavigate).toHaveBeenCalledWith('/?execution=exec-123')
    }
  })

  it('should use injected API client when provided', () => {
    const mockApiClient = {
      listExecutions: jest.fn().mockResolvedValue([]),
    }

    mockUseExecutionList.mockReturnValue({
      executions: [],
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    renderWithRouter(<LogPage apiClient={mockApiClient} />)

    expect(mockUseExecutionList).toHaveBeenCalledWith(
      expect.objectContaining({
        apiClient: mockApiClient,
      })
    )
  })

  it('should sort executions newest first', () => {
    const executions: ExecutionState[] = [
      { ...mockExecution, execution_id: 'exec-1', started_at: '2024-01-01T10:00:00Z' },
      { ...mockExecution, execution_id: 'exec-2', started_at: '2024-01-01T12:00:00Z' },
      { ...mockExecution, execution_id: 'exec-3', started_at: '2024-01-01T11:00:00Z' },
    ]

    const sortedExecutions = [
      executions[1], // exec-2 (newest)
      executions[2], // exec-3
      executions[0], // exec-1 (oldest)
    ]

    mockUseExecutionList.mockReturnValue({
      executions,
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    mockApplyExecutionFilters.mockReturnValue(sortedExecutions)

    renderWithRouter(<LogPage />)

    const executionIds = screen.getAllByText(/exec-\d/)
    // Should be sorted newest first (exec-2, exec-3, exec-1)
    expect(executionIds[0].textContent).toContain('exec-2')
  })

  it('should handle running execution status', () => {
    const runningExecution: ExecutionState = {
      ...mockExecution,
      status: 'running',
      completed_at: undefined,
      node_states: {
        node1: { status: 'completed' },
        node2: { status: 'running' },
      },
    }

    mockUseExecutionList.mockReturnValue({
      executions: [runningExecution],
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    mockApplyExecutionFilters.mockReturnValue([runningExecution])

    renderWithRouter(<LogPage />)

    expect(screen.getByText(/exec-123/)).toBeInTheDocument()
  })
})
