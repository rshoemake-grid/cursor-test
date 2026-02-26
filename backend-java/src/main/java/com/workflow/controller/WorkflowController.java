package com.workflow.controller;

import com.workflow.dto.WorkflowCreate;
import com.workflow.dto.WorkflowResponse;
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

/**
 * Workflow Controller - matches Python workflow_routes.py
 * SRP: Only handles HTTP requests/responses, delegates business logic to service
 * Endpoints: /api/v1/workflows
 */
@RestController
@RequestMapping("/api/v1/workflows")
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
        log.debug("POST /api/v1/workflows - Creating workflow: {}", workflowCreate.getName());
        
        String userId = authenticationHelper.extractUserId(authentication);
        WorkflowResponse response = workflowService.createWorkflow(workflowCreate, userId);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "List Workflows", description = "List workflows accessible to the authenticated user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Workflows retrieved successfully")
    })
    public ResponseEntity<List<WorkflowResponse>> listWorkflows(Authentication authentication) {
        log.debug("GET /api/v1/workflows - Listing workflows");
        
        String userId = authenticationHelper.extractUserId(authentication);
        List<WorkflowResponse> workflows = workflowService.listWorkflows(userId);
        
        return ResponseEntity.ok(workflows);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Workflow", description = "Get a workflow by ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Workflow retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Workflow not found")
    })
    public ResponseEntity<WorkflowResponse> getWorkflow(@PathVariable String id) {
        log.debug("GET /api/v1/workflows/{} - Fetching workflow", id);
        
        WorkflowResponse workflow = workflowService.getWorkflow(id);
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
            @Valid @RequestBody WorkflowCreate workflowCreate) {
        log.debug("PUT /api/v1/workflows/{} - Updating workflow", id);
        
        WorkflowResponse response = workflowService.updateWorkflow(id, workflowCreate);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Workflow", description = "Delete a workflow by ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Workflow deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Workflow not found")
    })
    public ResponseEntity<Void> deleteWorkflow(@PathVariable String id) {
        log.debug("DELETE /api/v1/workflows/{} - Deleting workflow", id);
        
        workflowService.deleteWorkflow(id);
        return ResponseEntity.noContent().build();
    }
}
