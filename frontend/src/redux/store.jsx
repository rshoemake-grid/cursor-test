import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import { workflowReducer } from "./workflow/workflowSlice";
import { executionsReducer } from "./executions/executionsSlice";
import { fetchExecutionsRequested } from "./executions/executionsActions";
import rootSaga from "./rootSaga";

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: {
    workflow: workflowReducer,
    executions: executionsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [fetchExecutionsRequested.type],
        ignoredActionPaths: ["payload.apiClient"],
      },
    }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export { store };
