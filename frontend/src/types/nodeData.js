/**
 * Type definitions for node data structures
 * Replaces 'any' types throughout the codebase
 */ // Type guards
export function isAgentNode(node) {
    return node?.type === 'agent';
}
export function isConditionNode(node) {
    return node?.type === 'condition';
}
export function isLoopNode(node) {
    return node?.type === 'loop';
}
export function isInputNode(node) {
    return node !== null && [
        'gcp_bucket',
        'aws_s3',
        'gcp_pubsub',
        'local_filesystem',
        'database',
        'firebase',
        'bigquery'
    ].includes(node.type || '');
}
export function isStartNode(node) {
    return node?.type === 'start';
}
export function isEndNode(node) {
    return node?.type === 'end';
}
export function isToolNode(node) {
    return node?.type === 'tool';
}
