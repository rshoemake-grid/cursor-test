/**
 * Execution Status Utilities
 * Extracted for better testability and Single Responsibility
 * Single Responsibility: Only handles execution status checking
 * NOTE: Use ES import, not CommonJS require - causes "require is not defined" in Vite/browser
 */ import { logicalOr } from './logicalOr';
import { EXECUTION_STATUS } from './websocketConstants';
import { isTemporaryExecutionId } from './executionIdValidation';
/**
 * Execution Status Checker
 * Consolidates all execution status checking logic
 * DRY: Single source of truth for status checks
 */ export class ExecutionStatusChecker {
    /**
   * Check if execution status indicates completion or failure
   * Mutation-resistant: uses constants for status comparisons
   */ static isTerminated(status, lastKnownStatus) {
        const currentStatus = logicalOr(status, lastKnownStatus);
        return currentStatus === EXECUTION_STATUS.COMPLETED || currentStatus === EXECUTION_STATUS.FAILED;
    }
    /**
   * Check if connection should be skipped
   * Mutation-resistant: explicit checks
   */ static shouldSkip(executionId, executionStatus, lastKnownStatus) {
        if (!executionId) return true;
        if (isTemporaryExecutionId(executionId)) return true;
        if (this.isTerminated(executionStatus, lastKnownStatus)) return true;
        return false;
    }
    /**
   * Check if reconnection should be attempted
   * Mutation-resistant: explicit checks
   */ static shouldReconnect(wasClean, code, attempt, maxAttempts, executionId, executionStatus, lastKnownStatus) {
        // Don't reconnect to temporary execution IDs
        if (isTemporaryExecutionId(executionId)) return false;
        // Don't reconnect if execution is terminated
        if (this.isTerminated(executionStatus, lastKnownStatus)) return false;
        // Don't reconnect if connection was closed cleanly
        if (wasClean && code === 1000) return false;
        // Don't reconnect if max attempts reached
        if (attempt >= maxAttempts) return false;
        // Don't reconnect if no execution ID
        if (!executionId) return false;
        return true;
    }
}
/**
 * Legacy function exports for backward compatibility
 * @deprecated Use ExecutionStatusChecker.isTerminated instead
 */ export function isExecutionTerminated(status, lastKnownStatus) {
    return ExecutionStatusChecker.isTerminated(status, lastKnownStatus);
}
/**
 * Legacy function exports for backward compatibility
 * @deprecated Use ExecutionStatusChecker.shouldSkip instead
 */ export function shouldSkipConnection(executionId, executionStatus, lastKnownStatus) {
    return ExecutionStatusChecker.shouldSkip(executionId, executionStatus, lastKnownStatus);
}
/**
 * Legacy function exports for backward compatibility
 * @deprecated Use ExecutionStatusChecker.shouldReconnect instead
 */ export function shouldReconnect(wasClean, code, attempt, maxAttempts, executionId, executionStatus, lastKnownStatus) {
    return ExecutionStatusChecker.shouldReconnect(wasClean, code, attempt, maxAttempts, executionId, executionStatus, lastKnownStatus);
}
