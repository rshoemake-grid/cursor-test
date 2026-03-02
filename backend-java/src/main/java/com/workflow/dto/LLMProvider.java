package com.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * LLM Provider DTO - matches Python LLMProvider schema
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LLMProvider {
    private String id;
    private String name;
    private String type;  // openai, anthropic, gemini, custom
    private String apiKey;
    private String baseUrl;
    private String defaultModel;
    private List<String> models;
    private Boolean enabled;
}
