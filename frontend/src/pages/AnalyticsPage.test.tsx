/**
 * Tests for AnalyticsPage Component
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import AnalyticsPage from './AnalyticsPage'
import { useExecutionListQuery } from '../hooks/log/useExecutionListQuery'
import { useExecutionAnalytics } from '../hooks/analytics/useExecutionAnalytics'

jest.mock('../hooks/log/useExecutionListQuery')
jest.mock('../hooks/analytics/useExecutionAnalytics')

const mockUseExecutionListQuery = useExecutionListQuery as jest.MockedFunction<typeof useExecutionListQuery>
const mockUseExecutionAnalytics = useExecutionAnalytics as jest.MockedFunction<typeof useExecutionAnalytics>

describe('AnalyticsPage', () => {
  const mockExecutions = [
    {
      execution_id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2026-02-23T12:00:00Z',
      completed_at: '2026-02-23T12:00:05Z',
      logs: [],
    },
    {
      execution_id: 'exec-2',
      workflow_id: 'workflow-1',
      status: 'failed',
      started_at: '2026-02-23T12:10:00Z',
      completed_at: '2026-02-23T12:10:03Z',
      logs: [],
    },
  ]

  const mockAnalytics = {
    totalExecutions: 2,
    successRate: 50,
    averageDuration: 4,
    totalDuration: 8,
    statusCounts: {
      completed: 1,
      failed: 1,
    },
    executionsByWorkflow: {
      'workflow-1': 2,
    },
    recentExecutions: mockExecutions,
    failedExecutions: [mockExecutions[1]],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseExecutionListQuery.mockReturnValue({
      data: mockExecutions,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any)
    mockUseExecutionAnalytics.mockReturnValue(mockAnalytics)
  })

  it('should render analytics page title', () => {
    render(<AnalyticsPage />)

    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Execution metrics and insights')).toBeInTheDocument()
  })

  it('should display key metrics', () => {
    render(<AnalyticsPage />)

    expect(screen.getByText('Total Executions')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Success Rate')).toBeInTheDocument()
    expect(screen.getByText('50.0%')).toBeInTheDocument()
    expect(screen.getByText('Failed Executions')).toBeInTheDocument()
  })

  it('should render status breakdown section', () => {
    render(<AnalyticsPage />)

    expect(screen.getByText('Status Breakdown')).toBeInTheDocument()
    expect(screen.getByText(/completed/i)).toBeInTheDocument()
    expect(screen.getByText(/failed/i)).toBeInTheDocument()
  })

  it('should render top workflows section', () => {
    render(<AnalyticsPage />)

    expect(screen.getByText('Top Workflows')).toBeInTheDocument()
    expect(screen.getByText(/workflow-1/i)).toBeInTheDocument()
  })

  it('should render recent executions section', () => {
    render(<AnalyticsPage />)

    expect(screen.getByText('Recent Executions')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    mockUseExecutionListQuery.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as any)

    render(<AnalyticsPage />)

    expect(screen.getByText('Loading analytics...')).toBeInTheDocument()
  })

  it('should show error state', () => {
    const error = new Error('Failed to load')
    mockUseExecutionListQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error,
      refetch: jest.fn(),
    } as any)

    render(<AnalyticsPage />)

    expect(screen.getByText(/Error:/i)).toBeInTheDocument()
    expect(screen.getByText('Failed to load')).toBeInTheDocument()
  })

  it('should render charts when data is available', () => {
    render(<AnalyticsPage />)

    // Check for chart containers (Recharts renders SVG elements)
    const charts = document.querySelectorAll('svg')
    expect(charts.length).toBeGreaterThan(0)
  })

  it('should handle empty executions gracefully', () => {
    mockUseExecutionListQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
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

    render(<AnalyticsPage />)

    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('No workflow data available')).toBeInTheDocument()
  })

  it('should use injected API client when provided', () => {
    const mockApiClient = {
      listExecutions: jest.fn(),
    }

    render(<AnalyticsPage apiClient={mockApiClient as any} />)

    expect(mockUseExecutionListQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        apiClient: mockApiClient,
      })
    )
  })
})
