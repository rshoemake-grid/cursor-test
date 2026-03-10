package com.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowChatRequest {
    private String workflowId;
    @NotBlank(message = "message is required")
    private String message;
    private List<ChatMessage> conversationHistory;
}
