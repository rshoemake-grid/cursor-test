import { canvasViewportStorageKey } from "./canvasViewportStorageKey";

describe("canvasViewportStorageKey", () => {
  it("uses workflow id when the tab has a saved server workflow", () => {
    expect(
      canvasViewportStorageKey({
        id: "tab-1",
        workflowId: "550e8400-e29b-41d4-a716-446655440000",
      }),
    ).toBe("wf:550e8400-e29b-41d4-a716-446655440000");
  });

  it("uses tab id for unsaved workflows", () => {
    expect(
      canvasViewportStorageKey({
        id: "workflow-123-abc",
        workflowId: null,
      }),
    ).toBe("tab:workflow-123-abc");
  });

  it("treats empty workflow id as unsaved", () => {
    expect(
      canvasViewportStorageKey({
        id: "t1",
        workflowId: "",
      }),
    ).toBe("tab:t1");
  });

  it("returns a stable fallback when tab is missing", () => {
    expect(canvasViewportStorageKey(null)).toBe("tab:unknown");
  });
});
