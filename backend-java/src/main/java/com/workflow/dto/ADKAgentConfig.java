package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * ADKAgentConfig DTO - matches Python ADKAgentConfig schema
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ADKAgentConfig {
    private String name;
    private String description;
    private String instruction;
    private List<String> subAgents;
    private List<String> adkTools;
    private String yamlConfig;
}
