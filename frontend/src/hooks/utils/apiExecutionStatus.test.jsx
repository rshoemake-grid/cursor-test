import { mapApiStatusToExecutionUiStatus } from "./apiExecutionStatus";

describe("mapApiStatusToExecutionUiStatus", () => {
  it("returns null when execution is nullish", () => {
    expect(mapApiStatusToExecutionUiStatus(null)).toBeNull();
    expect(mapApiStatusToExecutionUiStatus(undefined)).toBeNull();
  });

  it("maps string statuses case-insensitively", () => {
    expect(mapApiStatusToExecutionUiStatus({ status: "COMPLETED" })).toBe(
      "completed",
    );
    expect(mapApiStatusToExecutionUiStatus({ status: "Failed" })).toBe("failed");
  });

  it("maps enum-like { value } payloads", () => {
    expect(
      mapApiStatusToExecutionUiStatus({ status: { value: "completed" } }),
    ).toBe("completed");
  });

  it("maps US spelling canceled to cancelled", () => {
    expect(mapApiStatusToExecutionUiStatus({ status: "canceled" })).toBe(
      "cancelled",
    );
  });

  it("infers terminal from completed_at when status still running", () => {
    expect(
      mapApiStatusToExecutionUiStatus({
        status: "running",
        completed_at: "2026-01-01T00:00:00Z",
        error: null,
      }),
    ).toBe("completed");
    expect(
      mapApiStatusToExecutionUiStatus({
        status: "running",
        completed_at: "2026-01-01T00:00:00Z",
        error: "boom",
      }),
    ).toBe("failed");
  });

  it("returns null for unknown status without completed_at", () => {
    expect(mapApiStatusToExecutionUiStatus({ status: "unknown" })).toBeNull();
  });
});
