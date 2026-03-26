function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
/**
 * Workflow Execution Service
 * Extracted business logic from useWorkflowExecution hook
 * Follows Single Responsibility Principle - only handles execution logic
 */ import { logger } from '../../utils/logger';
/**
 * Service for workflow execution logic
 * Separated from React hook for better testability and reusability
 */ export class WorkflowExecutionService {
    /**
   * Execute a workflow
   * Single Responsibility: Only executes workflow
   */ async executeWorkflow({ workflowId, inputs, tempExecutionId, onExecutionStart }) {
        this.logger.debug('[WorkflowExecution] Executing workflow:', {
            workflowId,
            inputs
        });
        // Notify about temp execution ID
        if (onExecutionStart) {
            onExecutionStart(tempExecutionId);
        }
        // Execute workflow
        const execution = await this.api.executeWorkflow(workflowId, inputs);
        this.logger.debug('[WorkflowExecution] Execution response:', execution);
        // Update execution ID if different from temp
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
   */ createTempExecutionId() {
        return `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
   * Parse execution inputs safely
   */ parseExecutionInputs(inputsString) {
        try {
            return JSON.parse(inputsString);
        } catch (error) {
            this.logger.error('[WorkflowExecution] Failed to parse inputs:', error);
            throw new Error('Invalid JSON in execution inputs');
        }
    }
    constructor({ api, logger: injectedLogger = logger }){
        _define_property(this, "api", void 0);
        _define_property(this, "logger", void 0);
        this.api = api;
        this.logger = injectedLogger;
    }
}
