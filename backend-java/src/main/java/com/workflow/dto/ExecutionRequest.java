package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * ExecutionRequest DTO - matches Python ExecutionRequest schema ({@code workflow_id}, {@code inputs}).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionRequest {
    @JsonProperty("workflow_id")
    @JsonAlias({"workflowId"})
    private String workflowId;

    @JsonDeserialize(using = ExecutionRequestInputsDeserializer.class)
    private Map<String, Object> inputs;
}
