package com.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowChatRequest {
    private String workflowId;
    private String message;
    private List<ChatMessage> conversationHistory;
}
