import {
  mapApiStatusToExecutionUiStatus,
  normalizeExecutionListItem,
  hydrateExecutionLogsIfEmpty,
} from "./apiExecutionStatus";

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

  it("infers terminal from completedAt (camelCase) when status still running", () => {
    expect(
      mapApiStatusToExecutionUiStatus({
        status: "running",
        completedAt: "2026-01-01T00:00:00Z",
        error: null,
      }),
    ).toBe("completed");
  });

  it("returns null for unknown status without completed_at", () => {
    expect(mapApiStatusToExecutionUiStatus({ status: "unknown" })).toBeNull();
  });
});

describe("normalizeExecutionListItem", () => {
  it("coerces enum-shaped status to a string", () => {
    const row = normalizeExecutionListItem({
      execution_id: "e1",
      status: { value: "failed" },
      workflow_id: "w1",
      started_at: "2026-01-01T00:00:00Z",
    });
    expect(row.status).toBe("failed");
  });
});

describe("hydrateExecutionLogsIfEmpty", () => {
  it("fetches logs when detail payload has none but execution failed", async () => {
    const apiClient = {
      getExecutionLogs: jest.fn().mockResolvedValue({
        logs: [{ level: "ERROR", message: "x", timestamp: "2026-01-01T00:00:00Z" }],
      }),
    };
    const snapshot = {
      execution_id: "e1",
      workflow_id: "w1",
      status: "failed",
      started_at: "2026-01-01T00:00:00Z",
      completed_at: "2026-01-01T00:00:01Z",
      error: "boom",
      logs: [],
    };
    const out = await hydrateExecutionLogsIfEmpty(apiClient, snapshot);
    expect(apiClient.getExecutionLogs).toHaveBeenCalledWith("e1", {
      limit: 10000,
      offset: 0,
    });
    expect(out.logs).toHaveLength(1);
  });

  it("skips fetch when logs already present", async () => {
    const apiClient = { getExecutionLogs: jest.fn() };
    const snapshot = {
      execution_id: "e1",
      status: "failed",
      logs: [{ level: "INFO", message: "ok", timestamp: "2026-01-01T00:00:00Z" }],
    };
    const out = await hydrateExecutionLogsIfEmpty(apiClient, snapshot);
    expect(apiClient.getExecutionLogs).not.toHaveBeenCalled();
    expect(out).toBe(snapshot);
  });

  it("fetches logs using executionId camelCase and completedAt", async () => {
    const apiClient = {
      getExecutionLogs: jest.fn().mockResolvedValue({
        logs: [{ level: "ERROR", message: "x", timestamp: "2026-01-01T00:00:00Z" }],
      }),
    };
    const snapshot = {
      executionId: "e1",
      status: "failed",
      completedAt: "2026-01-01T00:00:01Z",
      error: "boom",
      logs: [],
    };
    const out = await hydrateExecutionLogsIfEmpty(apiClient, snapshot);
    expect(apiClient.getExecutionLogs).toHaveBeenCalledWith("e1", {
      limit: 10000,
      offset: 0,
    });
    expect(out.logs).toHaveLength(1);
  });
});
