import { ExecutionStateManager } from "./executionStateManager";
import { logger } from "../../utils/logger";
jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));
const mockLoggerDebug = logger.debug;
describe("ExecutionStateManager", () => {
  let manager;
  const createMockTab = (workflowId, executions = []) => ({
    id: `tab-${workflowId}`,
    name: `Workflow ${workflowId}`,
    workflowId,
    isUnsaved: false,
    executions,
    activeExecutionId: null,
  });
  beforeEach(() => {
    jest.clearAllMocks();
    manager = new ExecutionStateManager();
  });
  describe("handleExecutionStart", () => {
    it("should add new execution to active tab", () => {
      const tabs = [createMockTab("workflow-1")];
      const result = manager.handleExecutionStart(
        tabs,
        "tab-workflow-1",
        "exec-1",
      );
      expect(result[0].executions).toHaveLength(1);
      expect(result[0].executions[0].id).toBe("exec-1");
      expect(result[0].activeExecutionId).toBe("exec-1");
    });
    it("should replace oldest pending execution with real execution ID", () => {
      const pendingExec1 = {
        id: "pending-1",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const pendingExec2 = {
        id: "pending-2",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [pendingExec1, pendingExec2])];
      const result = manager.handleExecutionStart(
        tabs,
        "tab-workflow-1",
        "exec-real",
      );
      expect(result[0].executions).toHaveLength(2);
      expect(result[0].executions[1].id).toBe("exec-real");
      expect(result[0].executions[0].id).toBe("pending-1");
    });
    it("should update activeExecutionId if execution already exists", () => {
      const existingExec = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [existingExec])];
      const result = manager.handleExecutionStart(
        tabs,
        "tab-workflow-1",
        "exec-1",
      );
      expect(result[0].executions).toHaveLength(1);
      expect(result[0].activeExecutionId).toBe("exec-1");
    });
    it("should not modify tabs when active tab not found", () => {
      const tabs = [createMockTab("workflow-1")];
      const result = manager.handleExecutionStart(
        tabs,
        "non-existent-tab",
        "exec-1",
      );
      expect(result).toEqual(tabs);
      expect(result[0].executions).toHaveLength(0);
    });
    it("should not modify non-active tabs", () => {
      const tab1 = createMockTab("workflow-1");
      const tab2 = createMockTab("workflow-2");
      const tabs = [tab1, tab2];
      const result = manager.handleExecutionStart(
        tabs,
        "tab-workflow-1",
        "exec-1",
      );
      expect(result[0].executions).toHaveLength(1);
      expect(result[1].executions).toHaveLength(0);
      expect(result[1]).toEqual(tab2);
    });
  });
  describe("handleClearExecutions", () => {
    it("should clear executions for workflow", () => {
      const exec = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      const result = manager.handleClearExecutions(tabs, "workflow-1");
      expect(result[0].executions).toHaveLength(0);
      expect(result[0].activeExecutionId).toBeNull();
      expect(mockLoggerDebug).toHaveBeenCalled();
    });
    it("should not modify tabs when workflow not found", () => {
      const tabs = [createMockTab("workflow-1")];
      const result = manager.handleClearExecutions(
        tabs,
        "non-existent-workflow",
      );
      expect(result).toEqual(tabs);
    });
  });
  describe("handleRemoveExecution", () => {
    it("should remove execution from workflow", () => {
      const exec1 = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const exec2 = {
        id: "exec-2",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec1, exec2])];
      tabs[0].activeExecutionId = "exec-1";
      const result = manager.handleRemoveExecution(
        tabs,
        "workflow-1",
        "exec-1",
      );
      expect(result[0].executions).toHaveLength(1);
      expect(result[0].executions[0].id).toBe("exec-2");
      expect(result[0].activeExecutionId).toBe("exec-2");
      expect(mockLoggerDebug).toHaveBeenCalled();
    });
    it("should set activeExecutionId to null when removing last execution", () => {
      const exec = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      tabs[0].activeExecutionId = "exec-1";
      const result = manager.handleRemoveExecution(
        tabs,
        "workflow-1",
        "exec-1",
      );
      expect(result[0].executions).toHaveLength(0);
      expect(result[0].activeExecutionId).toBeNull();
    });
    it("should not modify tabs when workflow not found", () => {
      const tabs = [createMockTab("workflow-1")];
      const result = manager.handleRemoveExecution(
        tabs,
        "non-existent-workflow",
        "exec-1",
      );
      expect(result).toEqual(tabs);
    });
    it("should preserve activeExecutionId when removing non-active execution", () => {
      const exec1 = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const exec2 = {
        id: "exec-2",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec1, exec2])];
      tabs[0].activeExecutionId = "exec-1";
      const result = manager.handleRemoveExecution(
        tabs,
        "workflow-1",
        "exec-2",
      );
      expect(result[0].executions).toHaveLength(1);
      expect(result[0].executions[0].id).toBe("exec-1");
      expect(result[0].activeExecutionId).toBe("exec-1");
    });
  });
  describe("handleExecutionLogUpdate", () => {
    it("should add log to execution", () => {
      const exec = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      const newLog = {
        message: "New log",
        timestamp: new Date(),
      };
      const result = manager.handleExecutionLogUpdate(
        tabs,
        "workflow-1",
        "exec-1",
        newLog,
      );
      expect(result[0].executions[0].logs).toHaveLength(1);
      expect(result[0].executions[0].logs[0]).toEqual(newLog);
    });
    it("should not modify other executions", () => {
      const exec1 = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const exec2 = {
        id: "exec-2",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec1, exec2])];
      const result = manager.handleExecutionLogUpdate(
        tabs,
        "workflow-1",
        "exec-1",
        { message: "Log" },
      );
      expect(result[0].executions[0].logs).toHaveLength(1);
      expect(result[0].executions[1].logs).toHaveLength(0);
    });
    it("should return empty array when workflow not found", () => {
      const tabs = [createMockTab("workflow-1")];
      const result = manager.handleExecutionLogUpdate(
        tabs,
        "non-existent-workflow",
        "exec-1",
        { message: "Log" },
      );
      expect(result[0].executions).toEqual([]);
    });
  });
  describe("handleExecutionStatusUpdate", () => {
    it("should update execution status", () => {
      const exec = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      const result = manager.handleExecutionStatusUpdate(
        tabs,
        "workflow-1",
        "exec-1",
        "completed",
      );
      expect(result[0].executions[0].status).toBe("completed");
      expect(result[0].executions[0].completedAt).toBeDefined();
    });
    it("ignores WebSocket transport status strings (same tabs ref)", () => {
      const exec = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      const result = manager.handleExecutionStatusUpdate(
        tabs,
        "workflow-1",
        "exec-1",
        "connected",
      );
      expect(result).toBe(tabs);
      expect(result[0].executions[0].status).toBe("running");
    });
    it("should set completedAt for completed status", () => {
      const exec = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      const result = manager.handleExecutionStatusUpdate(
        tabs,
        "workflow-1",
        "exec-1",
        "completed",
      );
      expect(result[0].executions[0].completedAt).toBeDefined();
    });
    it("should set completedAt for failed status", () => {
      const exec = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      const result = manager.handleExecutionStatusUpdate(
        tabs,
        "workflow-1",
        "exec-1",
        "failed",
      );
      expect(result[0].executions[0].completedAt).toBeDefined();
    });
    it("should persist failure detail when failed with error message", () => {
      const exec = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      const result = manager.handleExecutionStatusUpdate(
        tabs,
        "workflow-1",
        "exec-1",
        "failed",
        "Permission denied on topic",
      );
      expect(result[0].executions[0].error).toBe(
        "Permission denied on topic",
      );
    });
    it("should clear error when status becomes completed", () => {
      const exec = {
        id: "exec-1",
        status: "failed",
        error: "previous failure",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      const result = manager.handleExecutionStatusUpdate(
        tabs,
        "workflow-1",
        "exec-1",
        "completed",
      );
      expect(result[0].executions[0].error).toBeUndefined();
    });
    it("should preserve completedAt when status is running", () => {
      const existingCompletedAt = new Date("2024-01-01");
      const exec = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        completedAt: existingCompletedAt,
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      const result = manager.handleExecutionStatusUpdate(
        tabs,
        "workflow-1",
        "exec-1",
        "running",
      );
      expect(result[0].executions[0].status).toBe("running");
      expect(result[0].executions[0].completedAt).toBe(existingCompletedAt);
    });
    it("should preserve completedAt when status is running and exec has no completedAt", () => {
      const exec = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      const result = manager.handleExecutionStatusUpdate(
        tabs,
        "workflow-1",
        "exec-1",
        "running",
      );
      expect(result[0].executions[0].status).toBe("running");
      expect(result[0].executions[0].completedAt).toBeUndefined();
    });
    it("should preserve existing completedAt when status changes to running", () => {
      const existingCompletedAt = new Date("2024-01-01");
      const exec = {
        id: "exec-1",
        status: "completed",
        startedAt: new Date(),
        completedAt: existingCompletedAt,
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      const result = manager.handleExecutionStatusUpdate(
        tabs,
        "workflow-1",
        "exec-1",
        "running",
      );
      expect(result[0].executions[0].status).toBe("running");
      expect(result[0].executions[0].completedAt).toBe(existingCompletedAt);
    });
    it("should use exec.completedAt branch when status is not completed or failed", () => {
      const existingCompletedAt = new Date("2024-01-01");
      const exec = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        completedAt: existingCompletedAt,
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      const result = manager.handleExecutionStatusUpdate(
        tabs,
        "workflow-1",
        "exec-1",
        "running",
      );
      expect(result[0].executions[0].completedAt).toBe(existingCompletedAt);
    });
    it("should return empty array when workflow not found", () => {
      const tabs = [createMockTab("workflow-1")];
      const result = manager.handleExecutionStatusUpdate(
        tabs,
        "non-existent-workflow",
        "exec-1",
        "completed",
      );
      expect(result[0].executions).toEqual([]);
    });
    it("should not modify executions that do not match executionId", () => {
      const exec1 = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const exec2 = {
        id: "exec-2",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec1, exec2])];
      const result = manager.handleExecutionStatusUpdate(
        tabs,
        "workflow-1",
        "exec-1",
        "completed",
      );
      expect(result[0].executions[0].status).toBe("completed");
      expect(result[0].executions[0].completedAt).toBeDefined();
      expect(result[0].executions[1].status).toBe("running");
      expect(result[0].executions[1].completedAt).toBeUndefined();
    });
  });
  describe("mergeExecutionFromServer", () => {
    it("should prefer longer API log list over streamed logs", () => {
      const exec = {
        id: "exec-1",
        status: "failed",
        error: "x",
        startedAt: new Date(),
        nodes: {},
        logs: [{ level: "INFO", message: "a" }],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      const result = manager.mergeExecutionFromServer(
        tabs,
        "workflow-1",
        "exec-1",
        {
          status: "failed",
          error: "persisted err",
          logs: [
            { level: "INFO", message: "a" },
            { level: "ERROR", message: "boom" },
          ],
          completed_at: "2026-01-01T12:00:00Z",
        },
      );
      expect(result[0].executions[0].logs).toHaveLength(2);
      expect(result[0].executions[0].logs[1].message).toBe("boom");
      expect(result[0].executions[0].error).toBe("persisted err");
    });
    it("should keep streamed logs when API returns fewer entries", () => {
      const exec = {
        id: "exec-1",
        status: "failed",
        startedAt: new Date(),
        nodes: {},
        logs: [
          { level: "INFO", message: "a" },
          { level: "ERROR", message: "client-only" },
        ],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      const result = manager.mergeExecutionFromServer(
        tabs,
        "workflow-1",
        "exec-1",
        {
          status: "failed",
          logs: [{ level: "INFO", message: "a" }],
        },
      );
      expect(result[0].executions[0].logs).toHaveLength(2);
    });
    it("should preserve client nodes when API has no node_states", () => {
      const exec = {
        id: "exec-1",
        status: "failed",
        startedAt: new Date(),
        nodes: { n1: { status: "failed", error: "e1" } },
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      const result = manager.mergeExecutionFromServer(
        tabs,
        "workflow-1",
        "exec-1",
        {
          status: "failed",
          logs: [],
        },
      );
      expect(result[0].executions[0].nodes.n1.error).toBe("e1");
    });
    it("should keep client failed status when API still reports running", () => {
      const exec = {
        id: "exec-1",
        status: "failed",
        error: "ws",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      const result = manager.mergeExecutionFromServer(
        tabs,
        "workflow-1",
        "exec-1",
        {
          status: "running",
          logs: [],
        },
      );
      expect(result[0].executions[0].status).toBe("failed");
    });
  });
  describe("handleExecutionNodeUpdate", () => {
    it("should update node state", () => {
      const exec = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      const nodeState = { status: "processing", data: { key: "value" } };
      const result = manager.handleExecutionNodeUpdate(
        tabs,
        "workflow-1",
        "exec-1",
        "node-1",
        nodeState,
      );
      expect(result[0].executions[0].nodes["node-1"]).toEqual(nodeState);
    });
    it("should preserve existing node states", () => {
      const exec = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        nodes: { "node-1": { status: "old" } },
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec])];
      const result = manager.handleExecutionNodeUpdate(
        tabs,
        "workflow-1",
        "exec-1",
        "node-2",
        { status: "new" },
      );
      expect(result[0].executions[0].nodes["node-1"]).toEqual({
        status: "old",
      });
      expect(result[0].executions[0].nodes["node-2"]).toEqual({
        status: "new",
      });
    });
    it("should return empty array when workflow not found", () => {
      const tabs = [createMockTab("workflow-1")];
      const result = manager.handleExecutionNodeUpdate(
        tabs,
        "non-existent-workflow",
        "exec-1",
        "node-1",
        { status: "new" },
      );
      expect(result[0].executions).toEqual([]);
    });
    it("should not modify executions that do not match executionId", () => {
      const exec1 = {
        id: "exec-1",
        status: "running",
        startedAt: new Date(),
        nodes: { "node-1": { status: "old" } },
        logs: [],
      };
      const exec2 = {
        id: "exec-2",
        status: "running",
        startedAt: new Date(),
        nodes: {},
        logs: [],
      };
      const tabs = [createMockTab("workflow-1", [exec1, exec2])];
      const result = manager.handleExecutionNodeUpdate(
        tabs,
        "workflow-1",
        "exec-1",
        "node-1",
        { status: "new" },
      );
      expect(result[0].executions[0].nodes["node-1"]).toEqual({
        status: "new",
      });
      expect(result[0].executions[1].nodes).toEqual({});
    });
  });
  describe("custom logger", () => {
    it("should use custom logger when provided", () => {
      const customLogger = {
        debug: jest.fn(),
        error: jest.fn(),
      };
      const customManager = new ExecutionStateManager({ logger: customLogger });
      const tabs = [createMockTab("workflow-1")];
      customManager.handleClearExecutions(tabs, "workflow-1");
      expect(customLogger.debug).toHaveBeenCalled();
      expect(mockLoggerDebug).not.toHaveBeenCalled();
    });
  });
});
