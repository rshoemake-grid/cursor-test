package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Node DTO - matches Python Node schema
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class Node {
    private String id;
    private NodeType type;
    private String name;
    private String description;
    @JsonProperty("agent_config")
    private AgentConfig agentConfig;
    @JsonProperty("condition_config")
    private ConditionConfig conditionConfig;
    @JsonProperty("loop_config")
    private LoopConfig loopConfig;
    @JsonProperty("input_config")
    private Map<String, Object> inputConfig;
    private List<InputMapping> inputs;
    private Map<String, Double> position;
    private Map<String, Object> data;
}
