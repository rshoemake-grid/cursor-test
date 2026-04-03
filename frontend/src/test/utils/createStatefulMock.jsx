function createStatefulMock(config) {
  let currentState = config.initialState;
  const updateState = (newState) => {
    currentState = newState;
    const mockFn = config.getMockFn();
    if (mockFn) {
      mockFn.mockReturnValue(config.createMockFn(currentState, updateState));
    }
  };
  const createMock = () => {
    return config.createMockFn(currentState, updateState);
  };
  const resetState = () => {
    currentState = config.initialState;
  };
  return {
    get state() {
      return currentState;
    },
    createMock,
    resetState,
    updateState,
  };
}
function createMultiStatefulMock(config) {
  let currentState = { ...config.initialState };
  const updateState = (newState) => {
    currentState = { ...currentState, ...newState };
    const mockFn = config.getMockFn();
    if (mockFn) {
      mockFn.mockReturnValue(config.createMockFn(currentState, updateState));
    }
  };
  const createMock = () => {
    return config.createMockFn(currentState, updateState);
  };
  const resetState = () => {
    currentState = { ...config.initialState };
  };
  return {
    get state() {
      return { ...currentState };
    },
    createMock,
    resetState,
    updateState,
  };
}
export { createMultiStatefulMock, createStatefulMock };
