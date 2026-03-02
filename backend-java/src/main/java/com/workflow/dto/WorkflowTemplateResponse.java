package com.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * WorkflowTemplateResponse - matches Python WorkflowTemplateResponse
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTemplateResponse {
    private String id;
    private String name;
    private String description;
    private String category;
    private List<String> tags;
    private String difficulty;
    private String estimatedTime;
    private Boolean isOfficial;
    private Integer usesCount;
    private Integer likesCount;
    private Integer rating;
    private String authorId;
    private String authorName;
    private String thumbnailUrl;
    private String previewImageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
