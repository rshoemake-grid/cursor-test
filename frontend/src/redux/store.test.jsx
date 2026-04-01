import { store } from "./store";
import { resetExecutions } from "./executions/executionsSlice";
import { replaceWorkflowState } from "./workflow/workflowSlice";

describe("redux store", () => {
  it("exposes workflow and executions state", () => {
    const s = store.getState();
    expect(s.workflow).toBeDefined();
    expect(s.executions).toBeDefined();
  });

  it("can reset executions for tests", () => {
    store.dispatch(resetExecutions());
    expect(store.getState().executions.status).toBe("idle");
  });

  it("can replace workflow slice state", () => {
    store.dispatch(
      replaceWorkflowState({
        workflowId: null,
        workflowName: "Untitled Workflow",
        workflowDescription: "",
        nodes: [],
        edges: [],
        variables: {},
      }),
    );
    expect(store.getState().workflow.workflowName).toBe("Untitled Workflow");
  });
});
