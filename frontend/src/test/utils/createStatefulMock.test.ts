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
    mockFn.mockReturnValue = jest.fn()
    const mockInstance = createStatefulMock({
      initialState: 'tab1',
      createMockFn: (currentState) => ({
        activeTab: currentState,
      }),
      getMockFn: () => mockFn as any,
    })

    expect(mockInstance.state).toBe('tab1')
    
    mockInstance.updateState('tab2')
    
    expect(mockInstance.state).toBe('tab2')
    const mock = mockInstance.createMock()
    expect(mock.activeTab).toBe('tab2')
    expect(mockFn.mockReturnValue).toHaveBeenCalled()
  })

  it('should reset state to initial value', () => {
    const mockInstance = createStatefulMock({
      initialState: 'tab1',
      createMockFn: (currentState) => ({
        activeTab: currentState,
      }),
      getMockFn: () => undefined,
    })

    mockInstance.updateState('tab2')
    expect(mockInstance.state).toBe('tab2')

    mockInstance.resetState()
    expect(mockInstance.state).toBe('tab1')
  })

  it('should work with setter functions', () => {
    const mockFn = jest.fn()
    mockFn.mockReturnValue = jest.fn()
    let capturedUpdateFn: ((newState: string) => void) | undefined
    
    const mockInstance = createStatefulMock({
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

    const mock = mockInstance.createMock()
    expect(mock.activeTab).toBe('tab1')

    mock.setActiveTab('tab2')
    expect(mockInstance.state).toBe('tab2')
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
    const mockInstance = createMultiStatefulMock({
      initialState: { tab: 'tab1', subTab: 'sub1' },
      createMockFn: (currentState) => ({
        activeTab: currentState.tab,
        subTab: currentState.subTab,
      }),
      getMockFn: () => mockFn as any,
    })

    expect(mockInstance.state.tab).toBe('tab1')
    expect(mockInstance.state.subTab).toBe('sub1')
    
    mockInstance.updateState({ tab: 'tab2' })
    
    // Access state getter after update (not destructured value)
    expect(mockInstance.state.tab).toBe('tab2')
    expect(mockInstance.state.subTab).toBe('sub1') // Should preserve other properties
    
    // Verify mock reflects updated state
    const mock = mockInstance.createMock()
    expect(mock.activeTab).toBe('tab2')
    expect(mock.subTab).toBe('sub1') // Should preserve other properties
  })

  it('should reset to initial state', () => {
    const mockInstance = createMultiStatefulMock({
      initialState: { tab: 'tab1', subTab: 'sub1' },
      createMockFn: (currentState) => ({
        activeTab: currentState.tab,
        subTab: currentState.subTab,
      }),
      getMockFn: () => undefined,
    })

    mockInstance.updateState({ tab: 'tab2', subTab: 'sub2' })
    expect(mockInstance.state.tab).toBe('tab2')
    expect(mockInstance.state.subTab).toBe('sub2')
    let mock = mockInstance.createMock()
    expect(mock.activeTab).toBe('tab2')
    expect(mock.subTab).toBe('sub2')

    mockInstance.resetState()
    expect(mockInstance.state.tab).toBe('tab1')
    expect(mockInstance.state.subTab).toBe('sub1')
    mock = mockInstance.createMock()
    expect(mock.activeTab).toBe('tab1')
    expect(mock.subTab).toBe('sub1')
  })
})
