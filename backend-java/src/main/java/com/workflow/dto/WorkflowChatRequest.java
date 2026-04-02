package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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

    /**
     * Optional cap on tool–LLM cycles (Python backend). Accepted for API parity; ignored for the Java single-completion path.
     */
    @Min(1)
    @Max(100)
    @JsonProperty("iteration_limit")
    private Integer iterationLimit;
}
