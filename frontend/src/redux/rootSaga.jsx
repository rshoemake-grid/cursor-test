import { all } from "redux-saga/effects";
import { watchFetchExecutions } from "./executions/executionsSagas";
import workflowRootSaga from "./workflow/workflowSagas";

export default function* rootSaga() {
  yield all([watchFetchExecutions(), workflowRootSaga()]);
}
