package com.workflow.controller;

import com.workflow.dto.*;
import com.workflow.service.ExecutionService;
import com.workflow.service.ExecutionOrchestratorService;
import com.workflow.util.AuthenticationHelper;
import com.workflow.util.ExecutionLogsFormatter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Execution Controller - matches Python execution_routes.py
 * Endpoints: /api/v1/workflows/{id}/execute, /api/v1/executions
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Executions", description = "Workflow execution operations")
public class ExecutionController {
    private static final Logger log = LoggerFactory.getLogger(ExecutionController.class);

    /** S-L3: Max log entries for download (avoids magic number) */
    private static final int MAX_LOG_DOWNLOAD_LIMIT = 100_000;

    private final ExecutionService executionService;
    private final ExecutionOrchestratorService executionOrchestratorService;
    private final AuthenticationHelper authenticationHelper;
    private final ExecutionLogsFormatter logsFormatter;

    public ExecutionController(ExecutionService executionService,
                              ExecutionOrchestratorService executionOrchestratorService,
                              AuthenticationHelper authenticationHelper,
                              ExecutionLogsFormatter logsFormatter) {
        this.executionService = executionService;
        this.executionOrchestratorService = executionOrchestratorService;
        this.authenticationHelper = authenticationHelper;
        this.logsFormatter = logsFormatter;
    }

    @PostMapping("/workflows/{workflowId}/execute")
    @Operation(summary = "Execute Workflow", description = "Execute a workflow with optional input data")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Workflow execution started"),
            @ApiResponse(responseCode = "404", description = "Workflow not found"),
            @ApiResponse(responseCode = "400", description = "LLM config missing or validation failed")
    })
    public ResponseEntity<ExecutionResponse> executeWorkflow(
            @PathVariable String workflowId,
            @RequestBody(required = false) ExecutionRequest executionRequest,
            Authentication authentication) {
        log.info("Executing workflow {} for user", workflowId);

        String userId = authenticationHelper.extractUserIdRequired(authentication);
        ExecutionResponse response = executionOrchestratorService.executeWorkflow(workflowId, userId, executionRequest);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/executions/{executionId}")
    @Operation(summary = "Get Execution", description = "Get execution by ID (owner only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Execution retrieved"),
            @ApiResponse(responseCode = "404", description = "Execution not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized")
    })
    public ResponseEntity<ExecutionResponse> getExecution(
            @PathVariable String executionId,
            Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        ExecutionResponse response = executionService.getExecution(executionId, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/executions")
    @Operation(summary = "List Executions", description = "List executions for the authenticated user (S-H6: ignores userId param)")
    public ResponseEntity<List<ExecutionResponse>> listExecutions(
            @RequestParam(required = false) String workflowId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer limit,
            @RequestParam(defaultValue = "0") int offset,
            Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        List<ExecutionResponse> executions = executionService.listExecutions(
                workflowId, userId, status, limit, offset);
        return ResponseEntity.ok(executions);
    }

    @GetMapping("/workflows/{workflowId}/executions")
    @Operation(summary = "List Workflow Executions", description = "List executions for a workflow (owner only)")
    public ResponseEntity<List<ExecutionResponse>> listWorkflowExecutions(
            @PathVariable String workflowId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer limit,
            @RequestParam(defaultValue = "0") int offset,
            Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        List<ExecutionResponse> executions = executionService.listExecutions(
                workflowId, userId, status, limit, offset);
        return ResponseEntity.ok(executions);
    }

    @GetMapping("/users/{userId}/executions")
    @Operation(summary = "List User Executions", description = "List executions for a user (path userId must match authenticated user)")
    public ResponseEntity<List<ExecutionResponse>> listUserExecutions(
            @PathVariable String userId,
            @RequestParam(required = false) String workflowId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer limit,
            @RequestParam(defaultValue = "0") int offset,
            Authentication authentication) {
        String authUserId = authenticationHelper.extractUserIdRequired(authentication);
        if (!authUserId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        List<ExecutionResponse> executions = executionService.listExecutions(
                workflowId, userId, status, limit, offset);
        return ResponseEntity.ok(executions);
    }

    @GetMapping("/executions/running")
    @Operation(summary = "List Running Executions", description = "List running executions for the authenticated user")
    public ResponseEntity<List<ExecutionResponse>> listRunningExecutions(Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        List<ExecutionResponse> executions = executionService.getRunningExecutions(userId);
        return ResponseEntity.ok(executions);
    }

    @GetMapping("/executions/{executionId}/logs")
    @Operation(summary = "Get Execution Logs", description = "Get execution logs with filtering (owner only)")
    public ResponseEntity<ExecutionLogsResponse> getExecutionLogs(
            @PathVariable String executionId,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String nodeId,
            @RequestParam(defaultValue = "1000") int limit,
            @RequestParam(defaultValue = "0") int offset,
            Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        ExecutionLogsResponse response = executionService.getExecutionLogs(executionId, userId, level, nodeId, limit, offset);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/executions/{executionId}/logs/download")
    @Operation(summary = "Download Execution Logs", description = "Download logs as text or JSON file (owner only)")
    public void downloadExecutionLogs(
            @PathVariable String executionId,
            @RequestParam(defaultValue = "text") String format,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String nodeId,
            HttpServletResponse httpResponse,
            Authentication authentication) throws IOException {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        ExecutionLogsResponse logsResponse = executionService.getExecutionLogs(
                executionId, userId, level, nodeId, MAX_LOG_DOWNLOAD_LIMIT, 0);

        String filename;
        String content;
        String mediaType;

        if ("json".equalsIgnoreCase(format)) {
            filename = "execution_" + executionId + "_logs.json";
            mediaType = MediaType.APPLICATION_JSON_VALUE;
            content = logsFormatter.formatAsJson(executionId, logsResponse);
        } else {
            filename = "execution_" + executionId + "_logs.txt";
            mediaType = MediaType.TEXT_PLAIN_VALUE;
            content = logsFormatter.formatAsText(executionId, logsResponse);
        }

        httpResponse.setContentType(mediaType);
        httpResponse.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");
        httpResponse.getOutputStream().write(content.getBytes(StandardCharsets.UTF_8));
        httpResponse.getOutputStream().flush();
    }

    @PostMapping("/executions/{executionId}/cancel")
    @Operation(summary = "Cancel Execution", description = "Cancel a running execution (owner only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Execution cancelled"),
            @ApiResponse(responseCode = "404", description = "Execution not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized"),
            @ApiResponse(responseCode = "400", description = "Execution not cancellable")
    })
    public ResponseEntity<ExecutionResponse> cancelExecution(
            @PathVariable String executionId,
            Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        ExecutionResponse response = executionService.cancelExecution(executionId, userId);
        return ResponseEntity.ok(response);
    }

}
