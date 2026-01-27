/**
 * Tests for useMarketplaceDialog hook
 */

import { renderHook, act } from '@testing-library/react'
import { useMarketplaceDialog } from './useMarketplaceDialog'

describe('useMarketplaceDialog', () => {
  it('should initialize with dialog closed and no node', () => {
    const { result } = renderHook(() => useMarketplaceDialog())

    expect(result.current.showMarketplaceDialog).toBe(false)
    expect(result.current.marketplaceNode).toBeNull()
  })

  it('should open dialog with a node', () => {
    const { result } = renderHook(() => useMarketplaceDialog())
    const testNode = {
      id: 'node1',
      type: 'agent',
      data: { name: 'Test Agent' },
    }

    act(() => {
      result.current.openDialog(testNode)
    })

    expect(result.current.showMarketplaceDialog).toBe(true)
    expect(result.current.marketplaceNode).toEqual(testNode)
  })

  it('should close dialog and clear node', () => {
    const { result } = renderHook(() => useMarketplaceDialog())
    const testNode = {
      id: 'node1',
      type: 'agent',
      data: { name: 'Test Agent' },
    }

    act(() => {
      result.current.openDialog(testNode)
    })

    expect(result.current.showMarketplaceDialog).toBe(true)

    act(() => {
      result.current.closeDialog()
    })

    expect(result.current.showMarketplaceDialog).toBe(false)
    expect(result.current.marketplaceNode).toBeNull()
  })

  it('should replace node when opening dialog with different node', () => {
    const { result } = renderHook(() => useMarketplaceDialog())
    const node1 = { id: 'node1', type: 'agent', data: { name: 'Agent 1' } }
    const node2 = { id: 'node2', type: 'agent', data: { name: 'Agent 2' } }

    act(() => {
      result.current.openDialog(node1)
    })

    expect(result.current.marketplaceNode).toEqual(node1)

    act(() => {
      result.current.openDialog(node2)
    })

    expect(result.current.marketplaceNode).toEqual(node2)
    expect(result.current.showMarketplaceDialog).toBe(true)
  })

  it('should handle closing dialog when already closed', () => {
    const { result } = renderHook(() => useMarketplaceDialog())

    act(() => {
      result.current.closeDialog()
    })

    expect(result.current.showMarketplaceDialog).toBe(false)
    expect(result.current.marketplaceNode).toBeNull()
  })
})
