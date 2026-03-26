import {
  EXECUTION_LIST_FETCH_REQUEST,
  EXECUTION_LIST_FETCH_SUCCESS,
  EXECUTION_LIST_FETCH_FAILURE,
} from '../actions/executionListActions'

const initialState = {
  items: [],
  loading: false,
  error: null,
}

export default function executionListReducer(state = initialState, action) {
  switch (action.type) {
    case EXECUTION_LIST_FETCH_REQUEST:
      return { ...state, loading: true, error: null }
    case EXECUTION_LIST_FETCH_SUCCESS:
      return { ...state, loading: false, items: action.payload ?? [] }
    case EXECUTION_LIST_FETCH_FAILURE:
      return { ...state, loading: false, error: action.payload }
    default:
      return state
  }
}
