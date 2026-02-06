/**
 * Tests for createStatefulMock utility
 */

import { createStatefulMock, createMultiStatefulMock } from './createStatefulMock'

describe('createStatefulMock', () => {
  it('should initialize with initial state', () => {
    const { state, createMock } = createStatefulMock({
      initialState: 'tab1',
      createMockFn: (currentState) => ({
        activeTab: currentState,
      }),
      getMockFn: () => undefined,
    })

    expect(state).toBe('tab1')
    expect(createMock().activeTab).toBe('tab1')
  })

  it('should update state when updateState is called', () => {
    const mockFn = jest.fn()
    const { state, updateState, createMock } = createStatefulMock({
      initialState: 'tab1',
      createMockFn: (currentState) => ({
        activeTab: currentState,
      }),
      getMockFn: () => mockFn as any,
    })

    expect(state).toBe('tab1')
    
    updateState('tab2')
    
    expect(state).toBe('tab2')
    const mock = createMock()
    expect(mock.activeTab).toBe('tab2')
    expect(mockFn.mockReturnValue).toHaveBeenCalled()
  })

  it('should reset state to initial value', () => {
    const { state, updateState, resetState } = createStatefulMock({
      initialState: 'tab1',
      createMockFn: (currentState) => ({
        activeTab: currentState,
      }),
      getMockFn: () => undefined,
    })

    updateState('tab2')
    expect(state).toBe('tab2')

    resetState()
    expect(state).toBe('tab1')
  })

  it('should work with setter functions', () => {
    const mockFn = jest.fn()
    let capturedUpdateFn: ((newState: string) => void) | undefined
    
    const { createMock, state } = createStatefulMock({
      initialState: 'tab1',
      createMockFn: (currentState, updateStateFn) => {
        capturedUpdateFn = updateStateFn
        return {
          activeTab: currentState,
          setActiveTab: jest.fn((tab: string) => {
            updateStateFn(tab)
          }),
        }
      },
      getMockFn: () => mockFn as any,
    })

    const mock = createMock()
    expect(mock.activeTab).toBe('tab1')

    mock.setActiveTab('tab2')
    expect(state).toBe('tab2')
    expect(mockFn.mockReturnValue).toHaveBeenCalled()
  })
})

describe('createMultiStatefulMock', () => {
  it('should initialize with initial state object', () => {
    const { state, createMock } = createMultiStatefulMock({
      initialState: { tab: 'tab1', subTab: 'sub1' },
      createMockFn: (currentState) => ({
        activeTab: currentState.tab,
        subTab: currentState.subTab,
      }),
      getMockFn: () => undefined,
    })

    expect(state.tab).toBe('tab1')
    expect(state.subTab).toBe('sub1')
    expect(createMock().activeTab).toBe('tab1')
    expect(createMock().subTab).toBe('sub1')
  })

  it('should update partial state', () => {
    const mockFn = jest.fn()
    const { state: initialState, updateState, createMock } = createMultiStatefulMock({
      initialState: { tab: 'tab1', subTab: 'sub1' },
      createMockFn: (currentState) => ({
        activeTab: currentState.tab,
        subTab: currentState.subTab,
      }),
      getMockFn: () => mockFn as any,
    })

    expect(initialState.tab).toBe('tab1')
    expect(initialState.subTab).toBe('sub1')
    
    updateState({ tab: 'tab2' })
    
    // Access state again after update
    const { state: updatedState } = createMultiStatefulMock({
      initialState: { tab: 'tab1', subTab: 'sub1' },
      createMockFn: (currentState) => ({
        activeTab: currentState.tab,
        subTab: currentState.subTab,
      }),
      getMockFn: () => mockFn as any,
    })
    
    // Instead, check via createMock which uses current state
    const mock = createMock()
    expect(mock.activeTab).toBe('tab2')
    expect(mock.subTab).toBe('sub1') // Should preserve other properties
  })

  it('should reset to initial state', () => {
    const { state, updateState, resetState, createMock } = createMultiStatefulMock({
      initialState: { tab: 'tab1', subTab: 'sub1' },
      createMockFn: (currentState) => ({
        activeTab: currentState.tab,
        subTab: currentState.subTab,
      }),
      getMockFn: () => undefined,
    })

    updateState({ tab: 'tab2', subTab: 'sub2' })
    expect(state.tab).toBe('tab2')
    expect(state.subTab).toBe('sub2')
    let mock = createMock()
    expect(mock.activeTab).toBe('tab2')
    expect(mock.subTab).toBe('sub2')

    resetState()
    expect(state.tab).toBe('tab1')
    expect(state.subTab).toBe('sub1')
    mock = createMock()
    expect(mock.activeTab).toBe('tab1')
    expect(mock.subTab).toBe('sub1')
  })
})
