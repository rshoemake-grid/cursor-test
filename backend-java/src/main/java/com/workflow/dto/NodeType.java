package com.workflow.dto;

/**
 * NodeType enum - matches Python NodeType enum.
 * OCP-4: Provides behavior methods (isStart, isEnd, isSkip, isCondition) for type checks.
 */
public enum NodeType {
    AGENT("agent"),
    TOOL("tool"),
    CONDITION("condition"),
    LOOP("loop"),
    START("start"),
    END("end"),
    GCP_BUCKET("gcp_bucket"),
    AWS_S3("aws_s3"),
    GCP_PUBSUB("gcp_pubsub"),
    LOCAL_FILESYSTEM("local_filesystem");

    private final String value;

    NodeType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    /**
     * OCP-4: Behavior methods for node type checks.
     */
    public boolean isStart() {
        return this == START;
    }

    public boolean isEnd() {
        return this == END;
    }

    /** True for START/END nodes that are skipped during execution. */
    public boolean isSkip() {
        return isStart() || isEnd();
    }

    public boolean isCondition() {
        return this == CONDITION;
    }

    /** Null-safe check: returns true if node's type is a skip type (START/END). */
    public static boolean isSkip(Node node) {
        return node != null && node.getType() != null && node.getType().isSkip();
    }

    /** Null-safe check: returns true if node's type is CONDITION. */
    public static boolean isCondition(Node node) {
        return node != null && node.getType() != null && node.getType().isCondition();
    }
}
