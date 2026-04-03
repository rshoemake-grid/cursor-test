import { renderHook } from "@testing-library/react";
import { useExecutionAnalytics } from "./useExecutionAnalytics";
describe("useExecutionAnalytics", () => {
  const mockExecutions = [
    {
      execution_id: "exec-1",
      workflow_id: "workflow-1",
      status: "completed",
      started_at: "2024-01-01T10:00:00Z",
      completed_at: "2024-01-01T10:00:05Z",
      node_states: {},
      variables: {},
      logs: [],
    },
    {
      execution_id: "exec-2",
      workflow_id: "workflow-1",
      status: "completed",
      started_at: "2024-01-01T11:00:00Z",
      completed_at: "2024-01-01T11:00:10Z",
      node_states: {},
      variables: {},
      logs: [],
    },
    {
      execution_id: "exec-3",
      workflow_id: "workflow-2",
      status: "failed",
      started_at: "2024-01-01T12:00:00Z",
      completed_at: "2024-01-01T12:00:15Z",
      error: "Test error",
      node_states: {},
      variables: {},
      logs: [],
    },
  ];
  it("should calculate total executions", () => {
    const { result } = renderHook(() =>
      useExecutionAnalytics({ executions: mockExecutions }),
    );
    expect(result.current.totalExecutions).toBe(3);
  });
  it("should calculate success rate", () => {
    const { result } = renderHook(() =>
      useExecutionAnalytics({ executions: mockExecutions }),
    );
    expect(result.current.successRate).toBeCloseTo(66.67, 1);
  });
  it("should calculate status counts", () => {
    const { result } = renderHook(() =>
      useExecutionAnalytics({ executions: mockExecutions }),
    );
    expect(result.current.statusCounts.completed).toBe(2);
    expect(result.current.statusCounts.failed).toBe(1);
  });
  it("should calculate average duration", () => {
    const { result } = renderHook(() =>
      useExecutionAnalytics({ executions: mockExecutions }),
    );
    expect(result.current.averageDuration).toBe(10);
  });
  it("should group executions by workflow", () => {
    const { result } = renderHook(() =>
      useExecutionAnalytics({ executions: mockExecutions }),
    );
    expect(result.current.executionsByWorkflow["workflow-1"]).toBe(2);
    expect(result.current.executionsByWorkflow["workflow-2"]).toBe(1);
  });
  it("should return recent executions", () => {
    const { result } = renderHook(() =>
      useExecutionAnalytics({ executions: mockExecutions, recentLimit: 2 }),
    );
    expect(result.current.recentExecutions).toHaveLength(2);
    expect(result.current.recentExecutions[0].execution_id).toBe("exec-3");
  });
  it("should return failed executions", () => {
    const { result } = renderHook(() =>
      useExecutionAnalytics({ executions: mockExecutions }),
    );
    expect(result.current.failedExecutions).toHaveLength(1);
    expect(result.current.failedExecutions[0].execution_id).toBe("exec-3");
  });
  it("should handle empty executions", () => {
    const { result } = renderHook(() =>
      useExecutionAnalytics({ executions: [] }),
    );
    expect(result.current.totalExecutions).toBe(0);
    expect(result.current.successRate).toBe(0);
    expect(result.current.averageDuration).toBe(0);
    expect(result.current.statusCounts).toEqual({});
    expect(result.current.executionsByWorkflow).toEqual({});
    expect(result.current.recentExecutions).toEqual([]);
    expect(result.current.failedExecutions).toEqual([]);
  });
  it("should handle running executions in duration calculation", () => {
    const runningExecution = {
      execution_id: "exec-running",
      workflow_id: "workflow-1",
      status: "running",
      started_at: new Date(Date.now() - 5e3).toISOString(),
      // Started 5 seconds ago
      node_states: {},
      variables: {},
      logs: [],
    };
    const { result } = renderHook(() =>
      useExecutionAnalytics({ executions: [runningExecution] }),
    );
    expect(result.current.averageDuration).toBeGreaterThan(0);
  });
});
