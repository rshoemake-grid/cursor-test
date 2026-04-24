import { canvasViewportStorageKey } from "./canvasViewportStorageKey";

describe("canvasViewportStorageKey", () => {
  it("uses tab id when the tab has a saved server workflow (independent from other tabs)", () => {
    expect(
      canvasViewportStorageKey({
        id: "tab-1",
        workflowId: "550e8400-e29b-41d4-a716-446655440000",
      }),
    ).toBe("tab:tab-1");
  });

  it("gives different keys for two tabs on the same workflow", () => {
    const a = canvasViewportStorageKey({
      id: "tab-a",
      workflowId: "same-wf",
    });
    const b = canvasViewportStorageKey({
      id: "tab-b",
      workflowId: "same-wf",
    });
    expect(a).toBe("tab:tab-a");
    expect(b).toBe("tab:tab-b");
    expect(a).not.toBe(b);
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

  it("falls back to workflow id only when tab id is absent", () => {
    expect(
      canvasViewportStorageKey({
        workflowId: "orphan-wf",
      }),
    ).toBe("wf:orphan-wf");
  });
});
