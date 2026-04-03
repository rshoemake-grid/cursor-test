import { call, put, takeLatest } from "redux-saga/effects";
import { fetchExecutionsRequested } from "./executionsActions";
import { fetchSuccess, fetchFailed } from "./executionsSlice";

function buildListParams(filters) {
  return {
    limit: filters?.limit || 100,
    ...(filters?.status != null && { status: filters.status }),
    ...(filters?.workflow_id != null && { workflow_id: filters.workflow_id }),
    ...(filters?.offset != null && { offset: filters.offset }),
  };
}

function* fetchExecutionsWorker(action) {
  const { apiClient, filters } = action.payload;
  try {
    const params = buildListParams(filters);
    const data = yield call([apiClient, apiClient.listExecutions], params);
    yield put(fetchSuccess(data));
  } catch (e) {
    const message =
      e?.message != null ? String(e.message) : "Failed to load executions";
    yield put(fetchFailed(message));
  }
}

export function* watchFetchExecutions() {
  yield takeLatest(fetchExecutionsRequested.type, fetchExecutionsWorker);
}
