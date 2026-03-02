package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Request DTO for publishing an agent - matches Python PublishedAgentCreate schema
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublishedAgentCreateRequest {
    private String name;
    private String description;
    private String category;
    private List<String> tags;
    @JsonProperty("difficulty")
    private String difficulty = "beginner";
    @JsonProperty("estimated_time")
    private String estimatedTime;
    @JsonProperty("agent_config")
    private Map<String, Object> agentConfig;
}
