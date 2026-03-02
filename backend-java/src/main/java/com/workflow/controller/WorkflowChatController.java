package com.workflow.controller;

import com.workflow.dto.WorkflowChatRequest;
import com.workflow.dto.WorkflowChatResponse;
import com.workflow.service.WorkflowChatService;
import com.workflow.util.AuthenticationHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Workflow Chat Controller - matches Python workflow_chat_routes.py
 */
@RestController
@RequestMapping("/api/workflow-chat")
@Tag(name = "Workflow Chat", description = "LLM chat to create/edit workflows")
public class WorkflowChatController {
    private final WorkflowChatService workflowChatService;
    private final AuthenticationHelper authenticationHelper;

    public WorkflowChatController(WorkflowChatService workflowChatService, AuthenticationHelper authenticationHelper) {
        this.workflowChatService = workflowChatService;
        this.authenticationHelper = authenticationHelper;
    }

    @PostMapping("/chat")
    @Operation(summary = "Chat with Workflow")
    public ResponseEntity<WorkflowChatResponse> chat(@RequestBody WorkflowChatRequest request, Authentication auth) {
        String userId = authenticationHelper.extractUserIdNullable(auth);
        return ResponseEntity.ok(workflowChatService.chat(request, userId));
    }
}
