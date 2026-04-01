/**
 * Workflow state is updated synchronously via workflowSlice reducers.
 * This module is reserved for async workflow-related sagas if needed later.
 */
export default function* workflowRootSaga() {
  /* intentionally empty — workflow updates are synchronous via the slice */
}
