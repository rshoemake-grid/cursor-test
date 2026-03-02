package com.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowPublishRequest {
    private String category;  // automation, data-processing, etc.
    private List<String> tags;
    private String difficulty;  // beginner, intermediate, advanced
    private String estimatedTime;
}
