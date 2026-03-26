import { combineReducers } from 'redux'
import workflowReducer from './reducers/workflowReducer'
import executionListReducer from './reducers/executionListReducer'

const rootReducer = combineReducers({
  workflow: workflowReducer,
  executionList: executionListReducer,
})

export default rootReducer
