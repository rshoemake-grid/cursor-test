package com.workflow.config;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * JSON row shape for {@code default-marketplace-templates.json} (parity with Python
 * {@code BUNDLED_MARKETPLACE_TEMPLATES}).
 */
public record BundledMarketplaceTemplate(
        String name,
        String description,
        String category,
        List<String> tags,
        String difficulty,
        @JsonProperty("estimated_time") String estimatedTime,
        @JsonProperty("is_official") boolean official,
        Map<String, Object> definition) {
}
