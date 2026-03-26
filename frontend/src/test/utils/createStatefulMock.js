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
 */ /**
 * Creates a stateful mock utility for testing hooks with state
 * 
 * @param config - Configuration for the stateful mock
 * @returns Object with state, createMock, resetState, and updateState functions
 */ export function createStatefulMock(config) {
    let currentState = config.initialState;
    const updateState = (newState)=>{
        currentState = newState;
        // Update mock return value for next render
        const mockFn = config.getMockFn();
        if (mockFn) {
            mockFn.mockReturnValue(config.createMockFn(currentState, updateState));
        }
    };
    const createMock = ()=>{
        return config.createMockFn(currentState, updateState);
    };
    const resetState = ()=>{
        currentState = config.initialState;
    };
    return {
        get state () {
            return currentState;
        },
        createMock,
        resetState,
        updateState
    };
}
export function createMultiStatefulMock(config) {
    let currentState = {
        ...config.initialState
    };
    const updateState = (newState)=>{
        currentState = {
            ...currentState,
            ...newState
        };
        const mockFn = config.getMockFn();
        if (mockFn) {
            mockFn.mockReturnValue(config.createMockFn(currentState, updateState));
        }
    };
    const createMock = ()=>{
        return config.createMockFn(currentState, updateState);
    };
    const resetState = ()=>{
        currentState = {
            ...config.initialState
        };
    };
    return {
        get state () {
            return {
                ...currentState
            };
        },
        createMock,
        resetState,
        updateState
    };
}
