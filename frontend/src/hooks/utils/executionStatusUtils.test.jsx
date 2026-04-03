import * as fs from "fs";
import * as path from "path";
import {
  ExecutionStatusChecker,
  isExecutionTerminated,
  shouldSkipConnection,
  shouldReconnect,
} from "./executionStatusUtils";
import { EXECUTION_STATUS } from "./websocketConstants";
describe("Vite/ESM browser compatibility", () => {
  it('must not use require() - would cause "require is not defined" in Vite browser build', () => {
    const filePath = path.join(__dirname, "executionStatusUtils.jsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/\brequire\s*\(/);
  });
});
describe("ExecutionStatusChecker", () => {
  describe("isTerminated", () => {
    it("should return true for completed status", () => {
      expect(
        ExecutionStatusChecker.isTerminated(EXECUTION_STATUS.COMPLETED),
      ).toBe(true);
    });
    it("should return true for failed status", () => {
      expect(ExecutionStatusChecker.isTerminated(EXECUTION_STATUS.FAILED)).toBe(
        true,
      );
    });
    it("should return false for running status", () => {
      expect(
        ExecutionStatusChecker.isTerminated(EXECUTION_STATUS.RUNNING),
      ).toBe(false);
    });
    it("should return false for pending status", () => {
      expect(ExecutionStatusChecker.isTerminated("pending")).toBe(false);
    });
    it("should return false for paused status", () => {
      expect(ExecutionStatusChecker.isTerminated("paused")).toBe(false);
    });
    it("should use lastKnownStatus when status is undefined", () => {
      expect(
        ExecutionStatusChecker.isTerminated(void 0, EXECUTION_STATUS.COMPLETED),
      ).toBe(true);
      expect(
        ExecutionStatusChecker.isTerminated(void 0, EXECUTION_STATUS.FAILED),
      ).toBe(true);
      expect(
        ExecutionStatusChecker.isTerminated(void 0, EXECUTION_STATUS.RUNNING),
      ).toBe(false);
    });
    it("should prioritize status over lastKnownStatus", () => {
      expect(
        ExecutionStatusChecker.isTerminated(
          EXECUTION_STATUS.RUNNING,
          EXECUTION_STATUS.COMPLETED,
        ),
      ).toBe(false);
      expect(
        ExecutionStatusChecker.isTerminated(
          EXECUTION_STATUS.COMPLETED,
          EXECUTION_STATUS.RUNNING,
        ),
      ).toBe(true);
    });
    it("should return false when both status and lastKnownStatus are undefined", () => {
      expect(ExecutionStatusChecker.isTerminated(void 0, void 0)).toBe(false);
    });
  });
  describe("shouldSkip", () => {
    it("should return true when executionId is null", () => {
      expect(
        ExecutionStatusChecker.shouldSkip(null, EXECUTION_STATUS.RUNNING),
      ).toBe(true);
    });
    it("should return true when executionId is empty string", () => {
      expect(
        ExecutionStatusChecker.shouldSkip("", EXECUTION_STATUS.RUNNING),
      ).toBe(true);
    });
    it("should return true for temporary execution IDs", () => {
      expect(
        ExecutionStatusChecker.shouldSkip(
          "pending-123",
          EXECUTION_STATUS.RUNNING,
        ),
      ).toBe(true);
    });
    it("should return true when execution is terminated", () => {
      expect(
        ExecutionStatusChecker.shouldSkip(
          "exec-123",
          EXECUTION_STATUS.COMPLETED,
        ),
      ).toBe(true);
      expect(
        ExecutionStatusChecker.shouldSkip("exec-123", EXECUTION_STATUS.FAILED),
      ).toBe(true);
    });
    it("should return false for valid running execution", () => {
      expect(
        ExecutionStatusChecker.shouldSkip("exec-123", EXECUTION_STATUS.RUNNING),
      ).toBe(false);
    });
    it("should return false for valid pending execution", () => {
      expect(ExecutionStatusChecker.shouldSkip("exec-123", "pending")).toBe(
        false,
      );
    });
    it("should check lastKnownStatus when status is undefined", () => {
      expect(
        ExecutionStatusChecker.shouldSkip(
          "exec-123",
          void 0,
          EXECUTION_STATUS.COMPLETED,
        ),
      ).toBe(true);
      expect(
        ExecutionStatusChecker.shouldSkip(
          "exec-123",
          void 0,
          EXECUTION_STATUS.RUNNING,
        ),
      ).toBe(false);
    });
  });
  describe("shouldReconnect", () => {
    it("should return false for temporary execution IDs", () => {
      expect(
        ExecutionStatusChecker.shouldReconnect(
          false,
          1006,
          1,
          3,
          "pending-123",
          EXECUTION_STATUS.RUNNING,
        ),
      ).toBe(false);
    });
    it("should return false when execution is terminated", () => {
      expect(
        ExecutionStatusChecker.shouldReconnect(
          false,
          1006,
          1,
          3,
          "exec-123",
          EXECUTION_STATUS.COMPLETED,
        ),
      ).toBe(false);
      expect(
        ExecutionStatusChecker.shouldReconnect(
          false,
          1006,
          1,
          3,
          "exec-123",
          EXECUTION_STATUS.FAILED,
        ),
      ).toBe(false);
    });
    it("should return false when connection was closed cleanly", () => {
      expect(
        ExecutionStatusChecker.shouldReconnect(
          true,
          1e3,
          1,
          3,
          "exec-123",
          EXECUTION_STATUS.RUNNING,
        ),
      ).toBe(false);
    });
    it("should return false when max attempts reached", () => {
      expect(
        ExecutionStatusChecker.shouldReconnect(
          false,
          1006,
          3,
          3,
          "exec-123",
          EXECUTION_STATUS.RUNNING,
        ),
      ).toBe(false);
      expect(
        ExecutionStatusChecker.shouldReconnect(
          false,
          1006,
          4,
          3,
          "exec-123",
          EXECUTION_STATUS.RUNNING,
        ),
      ).toBe(false);
    });
    it("should return false when executionId is null", () => {
      expect(
        ExecutionStatusChecker.shouldReconnect(
          false,
          1006,
          1,
          3,
          null,
          EXECUTION_STATUS.RUNNING,
        ),
      ).toBe(false);
    });
    it("should return true for unclean closure with running execution", () => {
      expect(
        ExecutionStatusChecker.shouldReconnect(
          false,
          1006,
          1,
          3,
          "exec-123",
          EXECUTION_STATUS.RUNNING,
        ),
      ).toBe(true);
    });
    it("should return true for unclean closure with pending execution", () => {
      expect(
        ExecutionStatusChecker.shouldReconnect(
          false,
          1006,
          1,
          3,
          "exec-123",
          "pending",
        ),
      ).toBe(true);
    });
    it("should return true when clean closure but code is not 1000", () => {
      expect(
        ExecutionStatusChecker.shouldReconnect(
          true,
          1001,
          1,
          3,
          "exec-123",
          EXECUTION_STATUS.RUNNING,
        ),
      ).toBe(true);
    });
    it("should check lastKnownStatus when status is undefined", () => {
      expect(
        ExecutionStatusChecker.shouldReconnect(
          false,
          1006,
          1,
          3,
          "exec-123",
          void 0,
          EXECUTION_STATUS.COMPLETED,
        ),
      ).toBe(false);
      expect(
        ExecutionStatusChecker.shouldReconnect(
          false,
          1006,
          1,
          3,
          "exec-123",
          void 0,
          EXECUTION_STATUS.RUNNING,
        ),
      ).toBe(true);
    });
  });
});
describe("Legacy function exports", () => {
  describe("isExecutionTerminated", () => {
    it("should delegate to ExecutionStatusChecker.isTerminated", () => {
      expect(isExecutionTerminated(EXECUTION_STATUS.COMPLETED)).toBe(true);
      expect(isExecutionTerminated(EXECUTION_STATUS.FAILED)).toBe(true);
      expect(isExecutionTerminated(EXECUTION_STATUS.RUNNING)).toBe(false);
      expect(isExecutionTerminated(void 0, EXECUTION_STATUS.COMPLETED)).toBe(
        true,
      );
    });
  });
  describe("shouldSkipConnection", () => {
    it("should delegate to ExecutionStatusChecker.shouldSkip", () => {
      expect(shouldSkipConnection(null, EXECUTION_STATUS.RUNNING)).toBe(true);
      expect(
        shouldSkipConnection("pending-123", EXECUTION_STATUS.RUNNING),
      ).toBe(true);
      expect(shouldSkipConnection("exec-123", EXECUTION_STATUS.COMPLETED)).toBe(
        true,
      );
      expect(shouldSkipConnection("exec-123", EXECUTION_STATUS.RUNNING)).toBe(
        false,
      );
    });
  });
  describe("shouldReconnect", () => {
    it("should delegate to ExecutionStatusChecker.shouldReconnect", () => {
      expect(
        shouldReconnect(
          false,
          1006,
          1,
          3,
          "exec-123",
          EXECUTION_STATUS.RUNNING,
        ),
      ).toBe(true);
      expect(
        shouldReconnect(true, 1e3, 1, 3, "exec-123", EXECUTION_STATUS.RUNNING),
      ).toBe(false);
      expect(
        shouldReconnect(
          false,
          1006,
          1,
          3,
          "pending-123",
          EXECUTION_STATUS.RUNNING,
        ),
      ).toBe(false);
    });
  });
});
