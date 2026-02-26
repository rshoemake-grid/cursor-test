package com.workflow.dto;

/**
 * ExecutionStatus enum - matches Python ExecutionStatus enum
 */
public enum ExecutionStatus {
    PENDING("pending"),
    RUNNING("running"),
    COMPLETED("completed"),
    FAILED("failed"),
    PAUSED("paused"),
    CANCELLED("cancelled");

    private final String value;

    ExecutionStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
