import { renderHook, act } from '@testing-library/react'
import { usePanelState } from './usePanelState'

describe('usePanelState', () => {
  it('should initialize with panel open and idle status', () => {
    const { result } = renderHook(() =>
      usePanelState({
        selectedNode: { id: 'node-1', type: 'agent', data: {} },
      })
    )

    expect(result.current.panelOpen).toBe(true)
    expect(result.current.saveStatus).toBe('idle')
  })

  it('should auto-open panel when node is selected', () => {
    const { result, rerender } = renderHook(
      ({ selectedNode }) => usePanelState({ selectedNode }),
      {
        initialProps: { selectedNode: null },
      }
    )

    expect(result.current.panelOpen).toBe(false)

    rerender({ selectedNode: { id: 'node-1', type: 'agent', data: {} } })

    expect(result.current.panelOpen).toBe(true)
  })

  it('should auto-close panel when node is deselected', () => {
    const { result, rerender } = renderHook(
      ({ selectedNode }) => usePanelState({ selectedNode }),
      {
        initialProps: { selectedNode: { id: 'node-1', type: 'agent', data: {} } },
      }
    )

    expect(result.current.panelOpen).toBe(true)

    rerender({ selectedNode: null })

    expect(result.current.panelOpen).toBe(false)
  })

  it('should close panel when closePanel is called', () => {
    const { result } = renderHook(() =>
      usePanelState({
        selectedNode: null, // No node selected, so panel can be closed
      })
    )

    // Panel should be closed initially when no node selected
    expect(result.current.panelOpen).toBe(false)

    // Open it first
    act(() => {
      result.current.openPanel()
    })

    expect(result.current.panelOpen).toBe(true)

    // Now close it
    act(() => {
      result.current.closePanel()
    })

    expect(result.current.panelOpen).toBe(false)
  })

  it('should open panel when openPanel is called', () => {
    const { result } = renderHook(() =>
      usePanelState({
        selectedNode: null,
      })
    )

    act(() => {
      result.current.openPanel()
    })

    expect(result.current.panelOpen).toBe(true)
  })

  it('should update saveStatus when setSaveStatus is called', () => {
    const { result } = renderHook(() =>
      usePanelState({
        selectedNode: { id: 'node-1', type: 'agent', data: {} },
      })
    )

    act(() => {
      result.current.setSaveStatus('saving')
    })

    expect(result.current.saveStatus).toBe('saving')

    act(() => {
      result.current.setSaveStatus('saved')
    })

    expect(result.current.saveStatus).toBe('saved')

    act(() => {
      result.current.setSaveStatus('idle')
    })

    expect(result.current.saveStatus).toBe('idle')
  })

  it('should update panelOpen when setPanelOpen is called', () => {
    const { result } = renderHook(() =>
      usePanelState({
        selectedNode: null, // No node selected, so we can control panel state
      })
    )

    // Panel should be closed initially when no node selected
    expect(result.current.panelOpen).toBe(false)

    act(() => {
      result.current.setPanelOpen(true)
    })

    expect(result.current.panelOpen).toBe(true)

    act(() => {
      result.current.setPanelOpen(false)
    })

    expect(result.current.panelOpen).toBe(false)
  })

  it('should handle Boolean conversion for selectedNode', () => {
    const { result, rerender } = renderHook(
      ({ selectedNode }) => usePanelState({ selectedNode }),
      {
        initialProps: { selectedNode: null },
      }
    )

    expect(result.current.panelOpen).toBe(false)

    rerender({ selectedNode: { id: 'node-1', type: 'agent', data: {} } })

    expect(result.current.panelOpen).toBe(true)

    rerender({ selectedNode: undefined as any })

    expect(result.current.panelOpen).toBe(false)
  })
})
