/**
 * Marketplace Selections Hook Tests
 * Tests for selection management hook to ensure mutation resistance
 */

import { renderHook, act } from '@testing-library/react'
import { useMarketplaceSelections } from './useMarketplaceSelections'

describe('useMarketplaceSelections', () => {
  it('should initialize with empty selections', () => {
    const { result } = renderHook(() => useMarketplaceSelections())

    expect(result.current.templateSelection.selectedIds.size).toBe(0)
    expect(result.current.agentSelection.selectedIds.size).toBe(0)
    expect(result.current.repositoryAgentSelection.selectedIds.size).toBe(0)
  })

  it('should allow selecting templates', () => {
    const { result } = renderHook(() => useMarketplaceSelections())

    act(() => {
      result.current.templateSelection.toggle('template-1')
    })

    expect(result.current.templateSelection.selectedIds.has('template-1')).toBe(true)
  })

  it('should allow selecting agents', () => {
    const { result } = renderHook(() => useMarketplaceSelections())

    act(() => {
      result.current.agentSelection.toggle('agent-1')
    })

    expect(result.current.agentSelection.selectedIds.has('agent-1')).toBe(true)
  })

  it('should allow selecting repository agents', () => {
    const { result } = renderHook(() => useMarketplaceSelections())

    act(() => {
      result.current.repositoryAgentSelection.toggle('repo-agent-1')
    })

    expect(result.current.repositoryAgentSelection.selectedIds.has('repo-agent-1')).toBe(true)
  })

  it('should clear all selections', () => {
    const { result } = renderHook(() => useMarketplaceSelections())

    act(() => {
      result.current.templateSelection.toggle('template-1')
      result.current.agentSelection.toggle('agent-1')
      result.current.repositoryAgentSelection.toggle('repo-agent-1')
    })

    expect(result.current.templateSelection.selectedIds.size).toBe(1)
    expect(result.current.agentSelection.selectedIds.size).toBe(1)
    expect(result.current.repositoryAgentSelection.selectedIds.size).toBe(1)

    act(() => {
      result.current.clearAllSelections()
    })

    expect(result.current.templateSelection.selectedIds.size).toBe(0)
    expect(result.current.agentSelection.selectedIds.size).toBe(0)
    expect(result.current.repositoryAgentSelection.selectedIds.size).toBe(0)
  })

  it('should clear selections for agents tab', () => {
    const { result } = renderHook(() => useMarketplaceSelections())

    act(() => {
      result.current.agentSelection.toggle('agent-1')
      result.current.templateSelection.toggle('template-1')
    })

    act(() => {
      result.current.clearSelectionsForTab('agents')
    })

    expect(result.current.agentSelection.selectedIds.size).toBe(0)
    expect(result.current.templateSelection.selectedIds.size).toBe(1) // Not cleared
  })

  it('should clear template selections for repository workflows tab', () => {
    const { result } = renderHook(() => useMarketplaceSelections())

    act(() => {
      result.current.templateSelection.toggle('template-1')
      result.current.agentSelection.toggle('agent-1')
    })

    act(() => {
      result.current.clearSelectionsForTab('repository', 'workflows')
    })

    expect(result.current.templateSelection.selectedIds.size).toBe(0)
    expect(result.current.agentSelection.selectedIds.size).toBe(1) // Not cleared
  })

  it('should clear repository agent selections for repository agents tab', () => {
    const { result } = renderHook(() => useMarketplaceSelections())

    act(() => {
      result.current.repositoryAgentSelection.toggle('repo-agent-1')
      result.current.templateSelection.toggle('template-1')
    })

    act(() => {
      result.current.clearSelectionsForTab('repository', 'agents')
    })

    expect(result.current.repositoryAgentSelection.selectedIds.size).toBe(0)
    expect(result.current.templateSelection.selectedIds.size).toBe(1) // Not cleared
  })

  it('should clear template selections for workflows-of-workflows tab', () => {
    const { result } = renderHook(() => useMarketplaceSelections())

    act(() => {
      result.current.templateSelection.toggle('template-1')
      result.current.agentSelection.toggle('agent-1')
    })

    act(() => {
      result.current.clearSelectionsForTab('workflows-of-workflows')
    })

    expect(result.current.templateSelection.selectedIds.size).toBe(0)
    expect(result.current.agentSelection.selectedIds.size).toBe(1) // Not cleared
  })
})
