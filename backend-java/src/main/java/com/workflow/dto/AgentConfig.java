package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
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
    private String agentType = "workflow";
    private String model = "gpt-4o-mini";
    private String systemPrompt;
    private Double temperature = 0.7;
    private Integer maxTokens;
    private List<String> tools;
    private ADKAgentConfig adkConfig;
}
