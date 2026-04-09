import { fetchExecutionsRequested } from "./executionsActions";
import { executionsReducer, fetchSuccess } from "./executionsSlice";

describe("executionsSlice", () => {
  it("normalizes execution status to lowercase on fetchSuccess", () => {
    let state = executionsReducer(undefined, fetchExecutionsRequested());
    state = executionsReducer(
      state,
      fetchSuccess([
        {
          execution_id: "e1",
          workflow_id: "w1",
          status: "FAILED",
        },
      ]),
    );
    expect(state.items[0].status).toBe("failed");
  });

  it("maps non-array fetchSuccess payload to empty items", () => {
    let state = executionsReducer(undefined, fetchExecutionsRequested());
    state = executionsReducer(state, fetchSuccess(null));
    expect(state.items).toEqual([]);
  });

  it("infers failed when status missing but error and completed_at present", () => {
    let state = executionsReducer(undefined, fetchExecutionsRequested());
    const completed = "2025-01-01T00:00:00Z";
    state = executionsReducer(
      state,
      fetchSuccess([
        {
          execution_id: "e2",
          workflow_id: "w1",
          status: "",
          error: "bad",
          completed_at: completed,
        },
      ]),
    );
    expect(state.items[0].status).toBe("failed");
  });

  it("normalizes canceled to cancelled", () => {
    let state = executionsReducer(undefined, fetchExecutionsRequested());
    state = executionsReducer(
      state,
      fetchSuccess([
        {
          execution_id: "e3",
          workflow_id: "w1",
          status: "CANCELED",
        },
      ]),
    );
    expect(state.items[0].status).toBe("cancelled");
  });
});
