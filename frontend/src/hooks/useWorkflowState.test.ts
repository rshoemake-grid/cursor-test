/**
 * Tests for useWorkflowState hook
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useWorkflowState } from './useWorkflowState'

describe('useWorkflowState', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useWorkflowState({
        workflowId: null,
        tabName: 'Test Tab',
      })
    )

    expect(result.current.localWorkflowId).toBeNull()
    expect(result.current.localWorkflowName).toBe('Untitled Workflow')
    expect(result.current.localWorkflowDescription).toBe('')
    expect(result.current.variables).toEqual({})
  })

  it('should initialize with provided workflowId', () => {
    const { result } = renderHook(() =>
      useWorkflowState({
        workflowId: 'workflow-123',
        tabName: 'Test Tab',
      })
    )

    expect(result.current.localWorkflowId).toBe('workflow-123')
  })

  it('should sync workflow name with tab name', async () => {
    const { result, rerender } = renderHook(
      ({ workflowId, tabName }) =>
        useWorkflowState({
          workflowId,
          tabName,
        }),
      {
        initialProps: {
          workflowId: null,
          tabName: 'Initial Tab',
        },
      }
    )

    expect(result.current.localWorkflowName).toBe('Untitled Workflow')

    rerender({ workflowId: null, tabName: 'Updated Tab' })

    await waitFor(() => {
      expect(result.current.localWorkflowName).toBe('Updated Tab')
    })
  })

  it('should sync local workflow ID when prop changes', async () => {
    const { result, rerender } = renderHook(
      ({ workflowId, tabName }) =>
        useWorkflowState({
          workflowId,
          tabName,
        }),
      {
        initialProps: {
          workflowId: 'workflow-1',
          tabName: 'Test Tab',
        },
      }
    )

    expect(result.current.localWorkflowId).toBe('workflow-1')

    rerender({ workflowId: 'workflow-2', tabName: 'Test Tab' })

    await waitFor(() => {
      expect(result.current.localWorkflowId).toBe('workflow-2')
    })
  })

  it('should allow updating workflow state via setters', () => {
    const { result } = renderHook(() =>
      useWorkflowState({
        workflowId: null,
        tabName: 'Test Tab',
      })
    )

    act(() => {
      result.current.setLocalWorkflowId('new-workflow-id')
      result.current.setLocalWorkflowName('New Workflow Name')
      result.current.setLocalWorkflowDescription('New description')
      result.current.setVariables({ var1: 'value1', var2: 'value2' })
    })

    expect(result.current.localWorkflowId).toBe('new-workflow-id')
    expect(result.current.localWorkflowName).toBe('New Workflow Name')
    expect(result.current.localWorkflowDescription).toBe('New description')
    expect(result.current.variables).toEqual({ var1: 'value1', var2: 'value2' })
  })

  it('should not update workflow name if tab name has not changed', () => {
    const { result } = renderHook(() =>
      useWorkflowState({
        workflowId: null,
        tabName: 'Test Tab',
      })
    )

    act(() => {
      result.current.setLocalWorkflowName('Custom Name')
    })

    expect(result.current.localWorkflowName).toBe('Custom Name')

    // Re-render with same tab name should not change it
    const { result: result2 } = renderHook(() =>
      useWorkflowState({
        workflowId: null,
        tabName: 'Test Tab',
      })
    )

    expect(result2.current.localWorkflowName).toBe('Untitled Workflow')
  })

  it('should handle null workflowId', () => {
    const { result } = renderHook(() =>
      useWorkflowState({
        workflowId: null,
        tabName: 'Test Tab',
      })
    )

    expect(result.current.localWorkflowId).toBeNull()

    act(() => {
      result.current.setLocalWorkflowId('new-id')
    })

    expect(result.current.localWorkflowId).toBe('new-id')

    act(() => {
      result.current.setLocalWorkflowId(null)
    })

    expect(result.current.localWorkflowId).toBeNull()
  })
})
