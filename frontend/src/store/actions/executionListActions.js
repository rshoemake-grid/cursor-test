/** Action types and creators for execution list (replaces React Query for this slice). */

export const EXECUTION_LIST_FETCH_REQUEST = 'executionList/FETCH_REQUEST'
export const EXECUTION_LIST_FETCH_SUCCESS = 'executionList/FETCH_SUCCESS'
export const EXECUTION_LIST_FETCH_FAILURE = 'executionList/FETCH_FAILURE'

export const executionListActions = {
  fetchRequest: (payload) => ({ type: EXECUTION_LIST_FETCH_REQUEST, payload }),
  fetchSuccess: (payload) => ({ type: EXECUTION_LIST_FETCH_SUCCESS, payload }),
  fetchFailure: (payload) => ({ type: EXECUTION_LIST_FETCH_FAILURE, payload }),
}
