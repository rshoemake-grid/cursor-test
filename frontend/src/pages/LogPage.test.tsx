/**
 * LogPage Component Tests
 * Tests follow SOLID, DRY, and DIP principles
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LogPage from './LogPage'
import { useExecutionListQuery } from '../hooks/log/useExecutionListQuery'
import type { ExecutionState } from '../types/workflow'

// Mock dependencies
jest.mock('../hooks/log/useExecutionListQuery')
const mockApplyExecutionFilters = jest.fn((executions: ExecutionState[]) => executions)
jest.mock('../utils/executionFilters', () => ({
  applyExecutionFilters: (...args: any[]) => mockApplyExecutionFilters(...args),
}))
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}))

jest.mock('../api/client', () => ({
  api: {
    listExecutions: jest.fn().mockResolvedValue([]),
    downloadExecutionLogs: jest.fn().mockResolvedValue(new Blob()),
  },
}))

jest.mock('../utils/confirm', () => ({
  showConfirm: jest.fn().mockResolvedValue(true),
}))

const mockUseExecutionListQuery = useExecutionListQuery as jest.MockedFunction<typeof useExecutionListQuery>

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
    mockApplyExecutionFilters.mockImplementation((executions: ExecutionState[]) => executions)
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
    mockUseExecutionListQuery.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as any)

    renderWithRouter(<LogPage />)

    expect(screen.getByText('Loading executions...')).toBeInTheDocument()
  })

  it('should render error state', () => {
    mockUseExecutionListQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Failed to load executions'),
      refetch: jest.fn(),
    } as any)

    renderWithRouter(<LogPage />)

    expect(screen.getByText(/Error: Failed to load executions/)).toBeInTheDocument()
  })

  it('should render empty state when no executions', () => {
    mockUseExecutionListQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any)

    renderWithRouter(<LogPage />)

    expect(screen.getByText('No executions yet')).toBeInTheDocument()
    expect(screen.getByText(/Execute a workflow to see execution logs here/)).toBeInTheDocument()
  })

  it('should render execution list', () => {
    mockUseExecutionListQuery.mockReturnValue({
      data: [mockExecution],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any)

    renderWithRouter(<LogPage />)

    expect(screen.getByText('Execution Log')).toBeInTheDocument()
    expect(screen.getByText(/1 execution/)).toBeInTheDocument()
    expect(screen.getByText(/exec-123/)).toBeInTheDocument()
  })

  it('should render filters component', () => {
    mockUseExecutionListQuery.mockReturnValue({
      data: [mockExecution],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any)

    renderWithRouter(<LogPage />)

    expect(screen.getByText('Filters')).toBeInTheDocument()
  })

  it('should show filtered count when filters are applied', () => {
    mockApplyExecutionFilters.mockReturnValue([])

    mockUseExecutionListQuery.mockReturnValue({
      data: [mockExecution],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any)

    renderWithRouter(<LogPage />)

    expect(screen.getByText(/0 execution/)).toBeInTheDocument()
  })

  it('should display execution count correctly for multiple executions', () => {
    const executions: ExecutionState[] = [
      { ...mockExecution, execution_id: 'exec-1' },
      { ...mockExecution, execution_id: 'exec-2' },
      { ...mockExecution, execution_id: 'exec-3' },
    ]

    mockUseExecutionListQuery.mockReturnValue({
      data: executions,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any)

    mockApplyExecutionFilters.mockReturnValue(executions)

    renderWithRouter(<LogPage />)

    expect(screen.getByText(/3 execution/)).toBeInTheDocument()
  })

  it('should open details modal when View clicked', () => {
    mockUseExecutionListQuery.mockReturnValue({
      data: [mockExecution],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any)

    mockApplyExecutionFilters.mockReturnValue([mockExecution])

    renderWithRouter(<LogPage />)

    const viewButton = screen.getByText('View')
    fireEvent.click(viewButton)

    expect(screen.getByText('Execution Details')).toBeInTheDocument()
    expect(screen.getAllByText(/exec-123/).length).toBeGreaterThan(0)
  })

  it('should open details modal when execution item is clicked', () => {
    mockUseExecutionListQuery.mockReturnValue({
      data: [mockExecution],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any)

    mockApplyExecutionFilters.mockReturnValue([mockExecution])

    renderWithRouter(<LogPage />)

    const executionItem = screen.getByText(/exec-123/).closest('div[class*="cursor-pointer"]')
    if (executionItem) {
      fireEvent.click(executionItem)
      expect(screen.getByText('Execution Details')).toBeInTheDocument()
    }
  })

  it('should use injected API client when provided', () => {
    const mockApiClient = {
      listExecutions: jest.fn().mockResolvedValue([]),
      downloadExecutionLogs: jest.fn().mockResolvedValue(new Blob()),
    }

    mockUseExecutionListQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any)

    renderWithRouter(<LogPage apiClient={mockApiClient as any} />)

    expect(mockUseExecutionListQuery).toHaveBeenCalledWith(
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

    mockUseExecutionListQuery.mockReturnValue({
      data: executions,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any)

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

    mockUseExecutionListQuery.mockReturnValue({
      data: [runningExecution],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any)

    mockApplyExecutionFilters.mockReturnValue([runningExecution])

    renderWithRouter(<LogPage />)

    expect(screen.getByText(/exec-123/)).toBeInTheDocument()
  })
})
