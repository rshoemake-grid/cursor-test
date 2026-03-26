/**
 * Execution Status Validation Utilities
 * Extracted from multiple hooks for better testability and mutation resistance
 * Single Responsibility: Only validates execution status values
 */ /**
 * Check if execution status is running
 * Mutation-resistant: explicit equality check
 */ export function isRunningStatus(status) {
    return status === 'running';
}
/**
 * Check if execution status is completed
 * Mutation-resistant: explicit equality check
 */ export function isCompletedStatus(status) {
    return status === 'completed';
}
/**
 * Check if execution status is failed
 * Mutation-resistant: explicit equality check
 */ export function isFailedStatus(status) {
    return status === 'failed';
}
/**
 * Check if execution status is paused
 * Mutation-resistant: explicit equality check
 */ export function isPausedStatus(status) {
    return status === 'paused';
}
/**
 * Check if execution status is terminated (completed or failed)
 * Mutation-resistant: explicit equality checks
 */ export function isTerminatedStatus(status) {
    return status === 'completed' || status === 'failed';
}
/**
 * Check if execution status has changed
 * Mutation-resistant: explicit inequality check
 */ export function hasStatusChanged(oldStatus, newStatus) {
    return oldStatus !== newStatus;
}
/**
 * Normalize execution status from API response
 * Maps paused to running and handles unknown statuses
 * Mutation-resistant: explicit equality checks
 */ export function normalizeExecutionStatus(status) {
    if (status === 'completed') {
        return 'completed';
    }
    if (status === 'failed') {
        return 'failed';
    }
    if (status === 'paused') {
        // Map paused to running for UI consistency
        return 'running';
    }
    // Default to running for unknown statuses
    return 'running';
}
