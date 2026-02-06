/**
 * Official Items Hook Tests
 * Tests for official items checking hook
 */

import { renderHook } from '@testing-library/react'
import { useOfficialItems } from './useOfficialItems'

describe('useOfficialItems', () => {
  it('should return false when no items selected', () => {
    const { result } = renderHook(() =>
      useOfficialItems({
        templates: [{ id: 't1', is_official: true }],
        agents: [{ id: 'a1', is_official: true }],
        templateSelection: { selectedIds: new Set() },
        agentSelection: { selectedIds: new Set() },
      })
    )

    expect(result.current.hasOfficialWorkflows).toBe(false)
    expect(result.current.hasOfficialAgents).toBe(false)
  })

  it('should return true when official workflow selected', () => {
    const { result } = renderHook(() =>
      useOfficialItems({
        templates: [
          { id: 't1', is_official: true },
          { id: 't2', is_official: false },
        ],
        agents: [],
        templateSelection: { selectedIds: new Set(['t1']) },
        agentSelection: { selectedIds: new Set() },
      })
    )

    expect(result.current.hasOfficialWorkflows).toBe(true)
  })

  it('should return false when only non-official workflows selected', () => {
    const { result } = renderHook(() =>
      useOfficialItems({
        templates: [
          { id: 't1', is_official: false },
          { id: 't2', is_official: false },
        ],
        agents: [],
        templateSelection: { selectedIds: new Set(['t1', 't2']) },
        agentSelection: { selectedIds: new Set() },
      })
    )

    expect(result.current.hasOfficialWorkflows).toBe(false)
  })

  it('should return true when official agent selected', () => {
    const { result } = renderHook(() =>
      useOfficialItems({
        templates: [],
        agents: [
          { id: 'a1', is_official: true },
          { id: 'a2', is_official: false },
        ],
        templateSelection: { selectedIds: new Set() },
        agentSelection: { selectedIds: new Set(['a1']) },
      })
    )

    expect(result.current.hasOfficialAgents).toBe(true)
  })

  it('should return false when only non-official agents selected', () => {
    const { result } = renderHook(() =>
      useOfficialItems({
        templates: [],
        agents: [
          { id: 'a1', is_official: false },
          { id: 'a2', is_official: false },
        ],
        templateSelection: { selectedIds: new Set() },
        agentSelection: { selectedIds: new Set(['a1', 'a2']) },
      })
    )

    expect(result.current.hasOfficialAgents).toBe(false)
  })

  it('should handle null templates', () => {
    const { result } = renderHook(() =>
      useOfficialItems({
        templates: null,
        agents: [],
        templateSelection: { selectedIds: new Set(['t1']) },
        agentSelection: { selectedIds: new Set() },
      })
    )

    expect(result.current.hasOfficialWorkflows).toBe(false)
  })

  it('should handle empty arrays', () => {
    const { result } = renderHook(() =>
      useOfficialItems({
        templates: [],
        agents: [],
        templateSelection: { selectedIds: new Set() },
        agentSelection: { selectedIds: new Set() },
      })
    )

    expect(result.current.hasOfficialWorkflows).toBe(false)
    expect(result.current.hasOfficialAgents).toBe(false)
  })

  it('should handle multiple selections with mixed official status', () => {
    const { result } = renderHook(() =>
      useOfficialItems({
        templates: [
          { id: 't1', is_official: false },
          { id: 't2', is_official: true },
        ],
        agents: [
          { id: 'a1', is_official: false },
          { id: 'a2', is_official: true },
        ],
        templateSelection: { selectedIds: new Set(['t1', 't2']) },
        agentSelection: { selectedIds: new Set(['a1', 'a2']) },
      })
    )

    expect(result.current.hasOfficialWorkflows).toBe(true)
    expect(result.current.hasOfficialAgents).toBe(true)
  })
})
