package com.workflow.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkDeleteRequest {
    @NotNull(message = "workflowIds is required")
    @NotEmpty(message = "workflowIds must not be empty")
    private List<String> workflowIds;
}
