package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Response DTO for published agent - matches Python PublishedAgentResponse schema
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishedAgentResponse {
    private String id;
    private String name;
    private String description;
    private String category;
    private List<String> tags;
    private String difficulty;
    @JsonProperty("estimated_time")
    private String estimatedTime;
    @JsonProperty("agent_config")
    private Map<String, Object> agentConfig;
    @JsonProperty("published_at")
    private LocalDateTime publishedAt;
    @JsonProperty("author_id")
    private String authorId;
    @JsonProperty("author_name")
    private String authorName;
    @JsonProperty("is_official")
    private Boolean isOfficial;
}
