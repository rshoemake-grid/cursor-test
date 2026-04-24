package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class ADKAgentConfig {
    private String name;
    private String description;
    private String instruction;
    @JsonProperty("sub_agents")
    @JsonAlias("subAgents")
    private List<String> subAgents;
    @JsonProperty("adk_tools")
    @JsonAlias("adkTools")
    private List<String> adkTools;
    @JsonProperty("yaml_config")
    @JsonAlias("yamlConfig")
    private String yamlConfig;
}
