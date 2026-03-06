package com.workflow.controller;

import com.workflow.service.ExecutionExportService;
import com.workflow.service.ExecutionStatsService;
import com.workflow.service.ExecutionService;
import com.workflow.service.WorkflowValidationService;
import com.workflow.service.WorkflowOwnershipService;
import com.workflow.util.AuthenticationHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Debug Controller - matches Python debug_routes.py
 * SRP-1: Delegates to WorkflowValidationService, ExecutionStatsService, ExecutionExportService.
 * Code Review 2026: Enforces ownership - workflow endpoints require workflow owner; execution endpoints require execution owner.
 */
@RestController
@RequestMapping("/api/debug")
@Tag(name = "Debug", description = "Debugging and validation endpoints")
public class DebugController {
    private final WorkflowValidationService workflowValidationService;
    private final ExecutionStatsService executionStatsService;
    private final ExecutionExportService executionExportService;
    private final WorkflowOwnershipService workflowOwnershipService;
    private final ExecutionService executionService;
    private final AuthenticationHelper authenticationHelper;

    public DebugController(WorkflowValidationService workflowValidationService,
                          ExecutionStatsService executionStatsService,
                          ExecutionExportService executionExportService,
                          WorkflowOwnershipService workflowOwnershipService,
                          ExecutionService executionService,
                          AuthenticationHelper authenticationHelper) {
        this.workflowValidationService = workflowValidationService;
        this.executionStatsService = executionStatsService;
        this.executionExportService = executionExportService;
        this.workflowOwnershipService = workflowOwnershipService;
        this.executionService = executionService;
        this.authenticationHelper = authenticationHelper;
    }

    @GetMapping("/workflow/{workflowId}/validate")
    @Operation(summary = "Validate Workflow")
    public ResponseEntity<Map<String, Object>> validate(@PathVariable String workflowId, Authentication auth) {
        String userId = authenticationHelper.extractUserIdRequired(auth);
        workflowOwnershipService.getWorkflowAndAssertOwner(workflowId, userId);
        return ResponseEntity.ok(workflowValidationService.validate(workflowId));
    }

    @GetMapping("/workflow/{workflowId}/executions/history")
    @Operation(summary = "Execution History")
    public ResponseEntity<List<Map<String, Object>>> executionHistory(
            @PathVariable String workflowId,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String status,
            Authentication auth) {
        String userId = authenticationHelper.extractUserIdRequired(auth);
        workflowOwnershipService.getWorkflowAndAssertOwner(workflowId, userId);
        return ResponseEntity.ok(executionStatsService.getExecutionHistory(workflowId, limit, status));
    }

    @GetMapping("/execution/{executionId}/timeline")
    @Operation(summary = "Execution Timeline")
    public ResponseEntity<Map<String, Object>> timeline(@PathVariable String executionId, Authentication auth) {
        String userId = authenticationHelper.extractUserIdRequired(auth);
        executionService.requireExecutionOwner(executionId, userId);
        return ResponseEntity.ok(executionStatsService.getTimeline(executionId));
    }

    @GetMapping("/execution/{executionId}/node/{nodeId}")
    @Operation(summary = "Node Execution Details")
    public ResponseEntity<Map<String, Object>> nodeDetails(
            @PathVariable String executionId,
            @PathVariable String nodeId,
            Authentication auth) {
        String userId = authenticationHelper.extractUserIdRequired(auth);
        executionService.requireExecutionOwner(executionId, userId);
        return ResponseEntity.ok(executionStatsService.getNodeDetails(executionId, nodeId));
    }

    @GetMapping("/workflow/{workflowId}/stats")
    @Operation(summary = "Workflow Stats")
    public ResponseEntity<Map<String, Object>> workflowStats(@PathVariable String workflowId, Authentication auth) {
        String userId = authenticationHelper.extractUserIdRequired(auth);
        workflowOwnershipService.getWorkflowAndAssertOwner(workflowId, userId);
        return ResponseEntity.ok(executionStatsService.getWorkflowStats(workflowId));
    }

    @PostMapping("/execution/{executionId}/export")
    @Operation(summary = "Export Execution")
    public ResponseEntity<Map<String, Object>> exportExecution(@PathVariable String executionId, Authentication auth) {
        String userId = authenticationHelper.extractUserIdRequired(auth);
        executionService.requireExecutionOwner(executionId, userId);
        return ResponseEntity.ok(executionExportService.exportExecution(executionId));
    }
}
