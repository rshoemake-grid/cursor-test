import { getExecutionStatusTone, isValidExecutionStatus } from "./executionStatus";
import { EXECUTION_STATUSES } from "../constants/stringLiterals";

describe("executionStatus utilities", () => {
  describe("getExecutionStatusTone", () => {
    it("returns completed for completed", () => {
      expect(getExecutionStatusTone("completed")).toBe("completed");
    });
    it("returns failed for failed", () => {
      expect(getExecutionStatusTone("failed")).toBe("failed");
    });
    it("returns running for running", () => {
      expect(getExecutionStatusTone("running")).toBe("running");
    });
    it("returns pending for pending", () => {
      expect(getExecutionStatusTone("pending")).toBe("pending");
    });
    it("returns paused for paused", () => {
      expect(getExecutionStatusTone("paused")).toBe("paused");
    });
    it("returns cancelled for cancelled", () => {
      expect(getExecutionStatusTone("cancelled")).toBe("cancelled");
    });
    it("returns paused for unknown status", () => {
      expect(getExecutionStatusTone("unknown")).toBe(EXECUTION_STATUSES.PAUSED);
    });
    it("returns paused for empty string", () => {
      expect(getExecutionStatusTone("")).toBe(EXECUTION_STATUSES.PAUSED);
    });
  });

  describe("isValidExecutionStatus", () => {
    it("should return true for valid statuses", () => {
      [
        "pending",
        "running",
        "completed",
        "failed",
        "paused",
        "cancelled",
      ].forEach((status) => {
        expect(isValidExecutionStatus(status)).toBe(true);
      });
    });
    it("should return false for invalid statuses", () => {
      ["unknown", "invalid", "", "123", null, void 0].forEach((status) => {
        expect(isValidExecutionStatus(status)).toBe(false);
      });
    });
  });
});
