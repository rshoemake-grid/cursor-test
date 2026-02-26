package com.workflow.dto;

/**
 * NodeType enum - matches Python NodeType enum
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
}
