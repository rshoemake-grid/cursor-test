import { selectExecutionStateForBuilderTab } from "./workflowExecutionTabs";

describe("selectExecutionStateForBuilderTab", () => {
  it("uses tabId when workflowId is null (unsaved tab)", () => {
    const tabs = [
      {
        tabId: "tab-a",
        workflowId: null,
        workflowName: "Draft",
        executions: [{ id: "exec-1", status: "running" }],
        activeExecutionId: "exec-1",
      },
    ];
    const { executions, activeExecutionId } = selectExecutionStateForBuilderTab(
      tabs,
      "tab-a",
      null,
    );
    expect(executions).toHaveLength(1);
    expect(executions[0].id).toBe("exec-1");
    expect(activeExecutionId).toBe("exec-1");
  });

  it("falls back to workflowId when tabId not present (legacy shape)", () => {
    const tabs = [
      {
        workflowId: "wf-1",
        workflowName: "Saved",
        executions: [{ id: "e2", status: "completed" }],
        activeExecutionId: "e2",
      },
    ];
    const { executions, activeExecutionId } = selectExecutionStateForBuilderTab(
      tabs,
      "any-tab",
      "wf-1",
    );
    expect(executions).toHaveLength(1);
    expect(activeExecutionId).toBe("e2");
  });
});
