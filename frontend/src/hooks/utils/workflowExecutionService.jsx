var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
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
    onExecutionStart
  }) {
    this.logger.debug("[WorkflowExecution] Executing workflow:", { workflowId, inputs });
    if (onExecutionStart) {
      onExecutionStart(tempExecutionId);
    }
    const execution = await this.api.executeWorkflow(workflowId, inputs);
    this.logger.debug("[WorkflowExecution] Execution response:", execution);
    const finalExecutionId = execution?.execution_id && execution.execution_id !== tempExecutionId ? execution.execution_id : tempExecutionId;
    if (finalExecutionId !== tempExecutionId && onExecutionStart) {
      onExecutionStart(finalExecutionId);
    }
    return {
      executionId: finalExecutionId,
      tempExecutionId
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
      return JSON.parse(inputsString);
    } catch (error) {
      this.logger.error("[WorkflowExecution] Failed to parse inputs:", error);
      throw new Error("Invalid JSON in execution inputs");
    }
  }
}
export {
  WorkflowExecutionService
};
