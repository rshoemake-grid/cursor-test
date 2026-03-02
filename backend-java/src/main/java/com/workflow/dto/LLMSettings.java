package com.workflow.dto;

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
}
