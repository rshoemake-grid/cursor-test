package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class WorkflowChatRequest {
    @JsonProperty("workflow_id")
    private String workflowId;
    @NotBlank(message = "message is required")
    private String message;
    @JsonProperty("conversation_history")
    private List<ChatMessage> conversationHistory;

    /**
     * Optional cap on tool–LLM cycles (Python backend). Accepted for API parity; ignored for the Java single-completion path.
     */
    @Min(1)
    @Max(100)
    @JsonProperty("iteration_limit")
    private Integer iterationLimit;

    /** Live canvas from the UI (optional); matches Python {@code canvas_snapshot}. */
    @JsonProperty("canvas_snapshot")
    private Map<String, Object> canvasSnapshot;
}
