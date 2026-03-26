import { all, fork } from 'redux-saga/effects'
import { executionListSaga } from './executionListSagas'
import { workflowSagas } from './workflowSagas'

export default function* rootSaga() {
  yield all([fork(executionListSaga), fork(workflowSagas)])
}
