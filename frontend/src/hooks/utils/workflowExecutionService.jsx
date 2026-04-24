var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) =>
  key in obj
    ? __defProp(obj, key, {
        enumerable: true,
        configurable: true,
        writable: true,
        value,
      })
    : (obj[key] = value);
var __publicField = (obj, key, value) =>
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { logger } from "../../utils/logger";
class WorkflowExecutionService {
  constructor({ api, logger: injectedLogger = logger }) {
    __publicField(this, "api");
    __publicField(this, "logger");
    this.api = api;
    this.logger = injectedLogger;
  }
  /**
   * Execute a workflow
   * Single Responsibility: Only executes workflow
   */
  async executeWorkflow({
    workflowId,
    inputs,
    tempExecutionId,
    onExecutionStart,
  }) {
    this.logger.debug("[WorkflowExecution] Executing workflow:", {
      workflowId,
      inputs,
    });
    if (onExecutionStart) {
      onExecutionStart(tempExecutionId, workflowId);
    }
    const execution = await this.api.executeWorkflow(workflowId, inputs);
    this.logger.debug("[WorkflowExecution] Execution response:", execution);
    const serverExecutionId =
      execution?.execution_id ?? execution?.executionId ?? null;
    const finalExecutionId =
      serverExecutionId != null &&
      serverExecutionId !== "" &&
      serverExecutionId !== tempExecutionId
        ? serverExecutionId
        : tempExecutionId;
    if (finalExecutionId !== tempExecutionId && onExecutionStart) {
      onExecutionStart(finalExecutionId, workflowId);
    }
    return {
      executionId: finalExecutionId,
      tempExecutionId,
    };
  }
  /**
   * Create a temporary execution ID
   */
  createTempExecutionId() {
    return `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Parse execution inputs safely
   */
  parseExecutionInputs(inputsString) {
    try {
      const parsed = JSON.parse(inputsString);
      if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {};
      }
      return parsed;
    } catch (error) {
      this.logger.error("[WorkflowExecution] Failed to parse inputs:", error);
      throw new Error("Invalid JSON in execution inputs");
    }
  }
}
export { WorkflowExecutionService };
