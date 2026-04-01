export function selectExecutionsState(state) {
  return state.executions;
}

export function selectExecutionsItems(state) {
  return state.executions.items;
}

export function selectExecutionsStatus(state) {
  return state.executions.status;
}

export function selectExecutionsError(state) {
  return state.executions.error;
}
