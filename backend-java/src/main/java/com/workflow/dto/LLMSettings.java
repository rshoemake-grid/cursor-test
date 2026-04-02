package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * LLM Settings DTO - matches Python LLMSettings schema
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LLMSettings {
    private List<LLMProvider> providers;
    private Integer iterationLimit = 10;
    private String defaultModel;
    /** Workflow builder chat model; empty uses default_model / first provider */
    @JsonProperty("chat_assistant_model")
    private String chatAssistantModel;
}
