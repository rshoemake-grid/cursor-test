import { takeLatest, call, put } from 'redux-saga/effects'
import {
  EXECUTION_LIST_FETCH_REQUEST,
  executionListActions,
} from '../actions/executionListActions'

function buildListParams(filters) {
  return {
    limit: filters?.limit ?? 100,
    ...(filters?.status && { status: filters.status }),
    ...(filters?.workflow_id && { workflow_id: filters.workflow_id }),
    ...(filters?.offset && { offset: filters.offset }),
  }
}

export function* fetchExecutionsWorker(action) {
  const { filters, apiClient } = action.payload || {}
  if (!apiClient?.listExecutions) {
    yield put(executionListActions.fetchFailure(new Error('API client not provided')))
    return
  }
  try {
    const params = buildListParams(filters)
    const data = yield call([apiClient, apiClient.listExecutions], params)
    yield put(executionListActions.fetchSuccess(data))
  } catch (err) {
    yield put(executionListActions.fetchFailure(err))
  }
}

export function* executionListSaga() {
  yield takeLatest(EXECUTION_LIST_FETCH_REQUEST, fetchExecutionsWorker)
}
