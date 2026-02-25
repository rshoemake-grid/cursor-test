/**
 * Tests for AnalyticsPage Component
 * Follows SOLID, DRY, and DIP principles
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AnalyticsPage from './AnalyticsPage'
import type { ExecutionState } from '../types/workflow'

// Mock the hooks
jest.mock('../hooks/log/useExecutionListQuery')
jest.mock('../hooks/analytics/useExecutionAnalytics')
jest.mock('../api/client', () => ({
  api: {
    listExecutions: jest.fn(),
  },
}))

import { useExecutionListQuery } from '../hooks/log/useExecutionListQuery'
import { useExecutionAnalytics } from '../hooks/analytics/useExecutionAnalytics'

const mockUseExecutionListQuery = useExecutionListQuery as jest.MockedFunction<
  typeof useExecutionListQuery
>
const mockUseExecutionAnalytics = useExecutionAnalytics as jest.MockedFunction<
  typeof useExecutionAnalytics
>

describe('AnalyticsPage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const mockExecutions: ExecutionState[] = [
    {
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2024-01-01T10:00:00Z',
      completed_at: '2024-01-01T10:00:05Z',
      node_states: {},
      variables: {},
      logs: [],
    },
    {
      execution_id: 'exec-2',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2024-01-01T11:00:00Z',
      completed_at: '2024-01-01T11:00:10Z',
      node_states: {},
      variables: {},
      logs: [],
    },
    {
      execution_id: 'exec-3',
      workflow_id: 'workflow-2',
      status: 'failed',
      started_at: '2024-01-01T12:00:00Z',
      completed_at: '2024-01-01T12:00:15Z',
      error: 'Test error',
      node_states: {},
      variables: {},
      logs: [],
    },
  ]

  const mockAnalytics = {
    totalExecutions: 3,
    successRate: 66.67,
    averageDuration: 10,
    totalDuration: 30,
    statusCounts: {
      completed: 2,
      failed: 1,
    },
    executionsByWorkflow: {
      'workflow-1': 2,
      'workflow-2': 1,
    },
    recentExecutions: mockExecutions.slice(0, 2),
    failedExecutions: [mockExecutions[2]],
  }

  it('should render loading state', () => {
    mockUseExecutionListQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
      refetch: jest.fn(),
    } as any)

    mockUseExecutionAnalytics.mockReturnValue(mockAnalytics)

    render(<AnalyticsPage />, { wrapper })

    expect(screen.getByText('Loading analytics...')).toBeInTheDocument()
  })

  it('should render error state', () => {
    mockUseExecutionListQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('API Error'),
      isError: true,
      refetch: jest.fn(),
    } as any)

    mockUseExecutionAnalytics.mockReturnValue(mockAnalytics)

    render(<AnalyticsPage />, { wrapper })

    expect(screen.getByText(/Error: API Error/)).toBeInTheDocument()
  })

  it('should render analytics dashboard', () => {
    mockUseExecutionListQuery.mockReturnValue({
      data: mockExecutions,
      isLoading: false,
      error: null,
      isError: false,
      refetch: jest.fn(),
    } as any)

    mockUseExecutionAnalytics.mockReturnValue(mockAnalytics)

    render(<AnalyticsPage />, { wrapper })

    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Execution metrics and insights')).toBeInTheDocument()
  })

  it('should display total executions', () => {
    mockUseExecutionListQuery.mockReturnValue({
      data: mockExecutions,
      isLoading: false,
      error: null,
      isError: false,
      refetch: jest.fn(),
    } as any)

    mockUseExecutionAnalytics.mockReturnValue(mockAnalytics)

    render(<AnalyticsPage />, { wrapper })

    expect(screen.getByText('Total Executions')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should display success rate', () => {
    mockUseExecutionListQuery.mockReturnValue({
      data: mockExecutions,
      isLoading: false,
      error: null,
      isError: false,
      refetch: jest.fn(),
    } as any)

    mockUseExecutionAnalytics.mockReturnValue(mockAnalytics)

    render(<AnalyticsPage />, { wrapper })

    expect(screen.getByText('Success Rate')).toBeInTheDocument()
    expect(screen.getByText('66.7%')).toBeInTheDocument()
  })

  it('should display failed executions count', () => {
    mockUseExecutionListQuery.mockReturnValue({
      data: mockExecutions,
      isLoading: false,
      error: null,
      isError: false,
      refetch: jest.fn(),
    } as any)

    mockUseExecutionAnalytics.mockReturnValue(mockAnalytics)

    render(<AnalyticsPage />, { wrapper })

    expect(screen.getByText('Failed Executions')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('should display status distribution', () => {
    mockUseExecutionListQuery.mockReturnValue({
      data: mockExecutions,
      isLoading: false,
      error: null,
      isError: false,
      refetch: jest.fn(),
    } as any)

    mockUseExecutionAnalytics.mockReturnValue(mockAnalytics)

    render(<AnalyticsPage />, { wrapper })

    expect(screen.getByText('Status Distribution')).toBeInTheDocument()
    // Check for status labels in the distribution section
    const statusDistributionSection = screen.getByText('Status Distribution').closest('.bg-white')
    expect(statusDistributionSection).toHaveTextContent(/completed/i)
    expect(statusDistributionSection).toHaveTextContent(/failed/i)
  })

  it('should display top workflows', () => {
    mockUseExecutionListQuery.mockReturnValue({
      data: mockExecutions,
      isLoading: false,
      error: null,
      isError: false,
      refetch: jest.fn(),
    } as any)

    mockUseExecutionAnalytics.mockReturnValue(mockAnalytics)

    render(<AnalyticsPage />, { wrapper })

    expect(screen.getByText('Top Workflows')).toBeInTheDocument()
    expect(screen.getByText(/2 executions/)).toBeInTheDocument()
  })

  it('should display recent executions', () => {
    mockUseExecutionListQuery.mockReturnValue({
      data: mockExecutions,
      isLoading: false,
      error: null,
      isError: false,
      refetch: jest.fn(),
    } as any)

    mockUseExecutionAnalytics.mockReturnValue(mockAnalytics)

    render(<AnalyticsPage />, { wrapper })

    expect(screen.getByText('Recent Executions')).toBeInTheDocument()
  })

  it('should handle empty executions', () => {
    mockUseExecutionListQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isError: false,
      refetch: jest.fn(),
    } as any)

    mockUseExecutionAnalytics.mockReturnValue({
      totalExecutions: 0,
      successRate: 0,
      averageDuration: 0,
      totalDuration: 0,
      statusCounts: {},
      executionsByWorkflow: {},
      recentExecutions: [],
      failedExecutions: [],
    })

    render(<AnalyticsPage />, { wrapper })

    expect(screen.getByText('Total Executions')).toBeInTheDocument()
    // Check that the page renders with empty state
    expect(screen.getByText('No workflow data available')).toBeInTheDocument()
    // Verify metrics are displayed (even if 0)
    expect(screen.getByText(/Success Rate/i)).toBeInTheDocument()
  })

  it('should accept custom apiClient prop', () => {
    const customApiClient = {
      listExecutions: jest.fn().mockResolvedValue([]),
    }

    mockUseExecutionListQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isError: false,
      refetch: jest.fn(),
    } as any)

    mockUseExecutionAnalytics.mockReturnValue({
      totalExecutions: 0,
      successRate: 0,
      averageDuration: 0,
      totalDuration: 0,
      statusCounts: {},
      executionsByWorkflow: {},
      recentExecutions: [],
      failedExecutions: [],
    })

    render(<AnalyticsPage apiClient={customApiClient} />, { wrapper })

    expect(mockUseExecutionListQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        apiClient: customApiClient,
      })
    )
  })
})
