/**
 * WebSocket URL Builder
 * Extracted for better testability and Single Responsibility
 * Single Responsibility: Only handles WebSocket URL building
 */ import { logicalOr } from './logicalOr';
/**
 * Build WebSocket URL from window location and execution ID
 * S-H3: Appends ?token=xxx when authToken provided for backend validation
 * Mutation-resistant: explicit null checks
 */ export function buildWebSocketUrl(executionId, windowLocation, authToken) {
    const protocol = windowLocation?.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = logicalOr(windowLocation?.host, 'localhost:8000');
    const base = `${protocol}//${host}/ws/executions/${executionId}`;
    if (authToken != null && authToken !== '') {
        return `${base}?token=${encodeURIComponent(authToken)}`;
    }
    return base;
}
