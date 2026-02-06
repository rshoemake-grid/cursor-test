/**
 * Stateful Mock Utility
 * 
 * Creates a stateful mock for hooks that manage state, allowing tests to verify
 * actual state changes when setters are called.
 * 
 * This pattern is useful for testing hooks that have state management, where
 * you need to verify that state changes are reflected in subsequent renders.
 * 
 * @example
 * ```typescript
 * // Define state type
 * type TabState = 'tab1' | 'tab2' | 'tab3'
 * 
 * // Create stateful mock
 * const { state, createMock, resetState } = createStatefulMock<TabState>({
 *   initialState: 'tab1',
 *   createMockFn: (currentState, updateState) => ({
 *     activeTab: currentState,
 *     setActiveTab: jest.fn((tab: TabState) => {
 *       updateState(tab)
 *     }),
 *     isTab1: currentState === 'tab1',
 *     isTab2: currentState === 'tab2',
 *   }),
 *   getMockFn: () => jest.mocked(require('../hooks/myHook').useMyHook),
 * })
 * 
 * // Use in jest.mock
 * jest.mock('../hooks/myHook', () => ({
 *   useMyHook: jest.fn(() => createMock()),
 * }))
 * 
 * // Reset in beforeEach
 * beforeEach(() => {
 *   resetState()
 *   jest.clearAllMocks()
 *   jest.mocked(useMyHook).mockReturnValue(createMock())
 * })
 * ```
 */

export interface StatefulMockConfig<TState, TMockReturn> {
  /**
   * Initial state value
   */
  initialState: TState

  /**
   * Function that creates the mock return value based on current state
   * @param currentState - The current state value
   * @param updateState - Function to update the state
   * @returns The mock return value
   */
  createMockFn: (currentState: TState, updateState: (newState: TState) => void) => TMockReturn

  /**
   * Function that returns the Jest mock function to update
   * This is used to update the mock return value when state changes
   * @returns The Jest mock function
   */
  getMockFn: () => jest.Mock<TMockReturn> | undefined
}

export interface StatefulMockResult<TState, TMockReturn> {
  /**
   * Current state value
   */
  state: TState

  /**
   * Function to create a mock with current state
   */
  createMock: () => TMockReturn

  /**
   * Function to reset state to initial value
   */
  resetState: () => void

  /**
   * Function to update state and mock return value
   */
  updateState: (newState: TState) => void
}

/**
 * Creates a stateful mock utility for testing hooks with state
 * 
 * @param config - Configuration for the stateful mock
 * @returns Object with state, createMock, resetState, and updateState functions
 */
export function createStatefulMock<TState, TMockReturn>(
  config: StatefulMockConfig<TState, TMockReturn>
): StatefulMockResult<TState, TMockReturn> {
  let currentState: TState = config.initialState

  const updateState = (newState: TState) => {
    currentState = newState
    // Update mock return value for next render
    const mockFn = config.getMockFn()
    if (mockFn) {
      mockFn.mockReturnValue(config.createMockFn(currentState, updateState))
    }
  }

  const createMock = (): TMockReturn => {
    return config.createMockFn(currentState, updateState)
  }

  const resetState = () => {
    currentState = config.initialState
  }

  return {
    get state() {
      return currentState
    },
    createMock,
    resetState,
    updateState,
  }
}

/**
 * Creates a stateful mock for hooks with multiple state values
 * 
 * @example
 * ```typescript
 * const { state, createMock, resetState } = createMultiStatefulMock({
 *   initialState: { tab: 'tab1', subTab: 'sub1' },
 *   createMockFn: (currentState, updateState) => ({
 *     activeTab: currentState.tab,
 *     subTab: currentState.subTab,
 *     setActiveTab: jest.fn((tab) => updateState({ ...currentState, tab })),
 *     setSubTab: jest.fn((subTab) => updateState({ ...currentState, subTab })),
 *   }),
 *   getMockFn: () => jest.mocked(require('../hooks/myHook').useMyHook),
 * })
 * ```
 */
export interface MultiStatefulMockConfig<TState extends Record<string, any>, TMockReturn> {
  initialState: TState
  createMockFn: (currentState: TState, updateState: (newState: Partial<TState>) => void) => TMockReturn
  getMockFn: () => jest.Mock<TMockReturn> | undefined
}

export interface MultiStatefulMockResult<TState extends Record<string, any>, TMockReturn> {
  state: TState
  createMock: () => TMockReturn
  resetState: () => void
  updateState: (newState: Partial<TState>) => void
}

export function createMultiStatefulMock<TState extends Record<string, any>, TMockReturn>(
  config: MultiStatefulMockConfig<TState, TMockReturn>
): MultiStatefulMockResult<TState, TMockReturn> {
  let currentState: TState = { ...config.initialState }

  const updateState = (newState: Partial<TState>) => {
    currentState = { ...currentState, ...newState }
    const mockFn = config.getMockFn()
    if (mockFn) {
      mockFn.mockReturnValue(config.createMockFn(currentState, updateState))
    }
  }

  const createMock = (): TMockReturn => {
    return config.createMockFn(currentState, updateState)
  }

  const resetState = () => {
    currentState = { ...config.initialState }
  }

  return {
    get state() {
      return { ...currentState }
    },
    createMock,
    resetState,
    updateState,
  }
}
