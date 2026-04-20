package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * AgentConfig DTO - matches Python AgentConfig schema
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AgentConfig {
    @JsonProperty("agent_type")
    private String agentType = "workflow";
    private String model = "gpt-4o-mini";
    @JsonProperty("system_prompt")
    private String systemPrompt;
    private Double temperature = 0.7;
    @JsonProperty("max_tokens")
    private Integer maxTokens;
    private List<String> tools;
    @JsonProperty("adk_config")
    private ADKAgentConfig adkConfig;
}
