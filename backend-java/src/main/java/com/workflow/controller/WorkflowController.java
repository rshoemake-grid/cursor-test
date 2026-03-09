package com.workflow.controller;

import com.workflow.dto.BulkDeleteRequest;
import com.workflow.dto.WorkflowCreate;
import com.workflow.dto.WorkflowPublishRequest;
import com.workflow.dto.WorkflowResponse;
import com.workflow.dto.WorkflowTemplateResponse;
import com.workflow.service.WorkflowService;
import com.workflow.util.AuthenticationHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Workflow Controller - matches Python workflow_routes.py
 * SRP: Only handles HTTP requests/responses, delegates business logic to service
 * Endpoints: /api/workflows
 */
@RestController
@RequestMapping("/api/workflows")
@Tag(name = "Workflows", description = "Workflow management operations")
public class WorkflowController {
    private static final Logger log = LoggerFactory.getLogger(WorkflowController.class);
    
    private final WorkflowService workflowService;
    private final AuthenticationHelper authenticationHelper;
    
    public WorkflowController(WorkflowService workflowService, AuthenticationHelper authenticationHelper) {
        this.workflowService = workflowService;
        this.authenticationHelper = authenticationHelper;
    }

    @PostMapping
    @Operation(summary = "Create Workflow", description = "Create a new workflow with nodes, edges, and variables")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Workflow created successfully"),
        @ApiResponse(responseCode = "422", description = "Validation error")
    })
    public ResponseEntity<WorkflowResponse> createWorkflow(
            @Valid @RequestBody WorkflowCreate workflowCreate,
            Authentication authentication) {
        log.debug("POST /api/workflows - Creating workflow: {}", workflowCreate.getName());
        
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        WorkflowResponse response = workflowService.createWorkflow(workflowCreate, userId);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "List Workflows", description = "List workflows accessible to the authenticated user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Workflows retrieved successfully")
    })
    public ResponseEntity<List<WorkflowResponse>> listWorkflows(Authentication authentication) {
        log.debug("GET /api/workflows - Listing workflows");
        
        String userId = authenticationHelper.extractUserId(authentication);
        List<WorkflowResponse> workflows = workflowService.listWorkflows(userId);
        
        return ResponseEntity.ok(workflows);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Workflow", description = "Get a workflow by ID (requires auth for non-public)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Workflow retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Workflow not found"),
        @ApiResponse(responseCode = "403", description = "Not authorized")
    })
    public ResponseEntity<WorkflowResponse> getWorkflow(@PathVariable String id, Authentication authentication) {
        log.debug("GET /api/workflows/{} - Fetching workflow", id);

        String userId = authenticationHelper.extractUserIdNullable(authentication);
        WorkflowResponse workflow = workflowService.getWorkflow(id, userId);
        return ResponseEntity.ok(workflow);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Workflow", description = "Update an existing workflow")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Workflow updated successfully"),
        @ApiResponse(responseCode = "404", description = "Workflow not found"),
        @ApiResponse(responseCode = "422", description = "Validation error")
    })
    public ResponseEntity<WorkflowResponse> updateWorkflow(
            @PathVariable String id,
            @Valid @RequestBody WorkflowCreate workflowCreate,
            Authentication authentication) {
        log.debug("PUT /api/workflows/{} - Updating workflow", id);

        String userId = authenticationHelper.extractUserIdRequired(authentication);
        WorkflowResponse response = workflowService.updateWorkflow(id, workflowCreate, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Workflow", description = "Delete a workflow by ID (owner only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Workflow deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Workflow not found"),
        @ApiResponse(responseCode = "403", description = "Not authorized")
    })
    public ResponseEntity<Void> deleteWorkflow(@PathVariable String id, Authentication authentication) {
        log.debug("DELETE /api/workflows/{} - Deleting workflow", id);

        String userId = authenticationHelper.extractUserIdRequired(authentication);
        workflowService.deleteWorkflow(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "Publish Workflow as Template")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Workflow published"),
        @ApiResponse(responseCode = "404", description = "Workflow not found")
    })
    public ResponseEntity<WorkflowTemplateResponse> publishWorkflow(
            @PathVariable String id,
            @RequestBody WorkflowPublishRequest request,
            Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        boolean isAdmin = authenticationHelper.extractIsAdmin(authentication);
        return ResponseEntity.status(201).body(workflowService.publishWorkflow(id, request, userId, isAdmin));
    }

    @PostMapping("/bulk-delete")
    @Operation(summary = "Bulk Delete Workflows")
    public ResponseEntity<Map<String, Object>> bulkDelete(@RequestBody BulkDeleteRequest request, Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        return ResponseEntity.ok(workflowService.bulkDelete(request.getWorkflowIds(), userId));
    }
}
