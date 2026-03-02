package com.workflow.controller;

import com.workflow.dto.*;
import com.workflow.service.ExecutionService;
import com.workflow.service.ExecutionOrchestratorService;
import com.workflow.util.AuthenticationHelper;
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
@RequestMapping("/api/v1")
@Tag(name = "Executions", description = "Workflow execution operations")
public class ExecutionController {
    private static final Logger log = LoggerFactory.getLogger(ExecutionController.class);

    private final ExecutionService executionService;
    private final ExecutionOrchestratorService executionOrchestratorService;
    private final AuthenticationHelper authenticationHelper;

    public ExecutionController(ExecutionService executionService,
                              ExecutionOrchestratorService executionOrchestratorService,
                              AuthenticationHelper authenticationHelper) {
        this.executionService = executionService;
        this.executionOrchestratorService = executionOrchestratorService;
        this.authenticationHelper = authenticationHelper;
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

        String userId = authenticationHelper.extractUserIdNullable(authentication);
        ExecutionResponse response = executionOrchestratorService.executeWorkflow(workflowId, userId, executionRequest);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/executions/{executionId}")
    @Operation(summary = "Get Execution", description = "Get execution by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Execution retrieved"),
            @ApiResponse(responseCode = "404", description = "Execution not found")
    })
    public ResponseEntity<ExecutionResponse> getExecution(@PathVariable String executionId) {
        ExecutionResponse response = executionService.getExecution(executionId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/executions")
    @Operation(summary = "List Executions", description = "List executions with filtering and pagination")
    public ResponseEntity<List<ExecutionResponse>> listExecutions(
            @RequestParam(required = false) String workflowId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer limit,
            @RequestParam(defaultValue = "0") int offset,
            Authentication authentication) {
        String effectiveUserId = userId != null ? userId : authenticationHelper.extractUserIdNullable(authentication);
        List<ExecutionResponse> executions = executionService.listExecutions(
                workflowId, effectiveUserId, status, limit, offset);
        return ResponseEntity.ok(executions);
    }

    @GetMapping("/workflows/{workflowId}/executions")
    @Operation(summary = "List Workflow Executions", description = "List executions for a workflow")
    public ResponseEntity<List<ExecutionResponse>> listWorkflowExecutions(
            @PathVariable String workflowId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer limit,
            @RequestParam(defaultValue = "0") int offset) {
        List<ExecutionResponse> executions = executionService.listExecutions(
                workflowId, null, status, limit, offset);
        return ResponseEntity.ok(executions);
    }

    @GetMapping("/users/{userId}/executions")
    @Operation(summary = "List User Executions", description = "List executions for a user")
    public ResponseEntity<List<ExecutionResponse>> listUserExecutions(
            @PathVariable String userId,
            @RequestParam(required = false) String workflowId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer limit,
            @RequestParam(defaultValue = "0") int offset) {
        List<ExecutionResponse> executions = executionService.listExecutions(
                workflowId, userId, status, limit, offset);
        return ResponseEntity.ok(executions);
    }

    @GetMapping("/executions/running")
    @Operation(summary = "List Running Executions", description = "List all currently running executions")
    public ResponseEntity<List<ExecutionResponse>> listRunningExecutions() {
        List<ExecutionResponse> executions = executionService.getRunningExecutions();
        return ResponseEntity.ok(executions);
    }

    @GetMapping("/executions/{executionId}/logs")
    @Operation(summary = "Get Execution Logs", description = "Get execution logs with filtering")
    public ResponseEntity<ExecutionLogsResponse> getExecutionLogs(
            @PathVariable String executionId,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String nodeId,
            @RequestParam(defaultValue = "1000") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        ExecutionLogsResponse response = executionService.getExecutionLogs(executionId, level, nodeId, limit, offset);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/executions/{executionId}/logs/download")
    @Operation(summary = "Download Execution Logs", description = "Download logs as text or JSON file")
    public void downloadExecutionLogs(
            @PathVariable String executionId,
            @RequestParam(defaultValue = "text") String format,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String nodeId,
            HttpServletResponse httpResponse) throws IOException {
        ExecutionLogsResponse logsResponse = executionService.getExecutionLogs(
                executionId, level, nodeId, 100_000, 0);

        String filename;
        String content;
        String mediaType;

        if ("json".equalsIgnoreCase(format)) {
            filename = "execution_" + executionId + "_logs.json";
            mediaType = MediaType.APPLICATION_JSON_VALUE;
            content = buildLogsJson(executionId, logsResponse);
        } else {
            filename = "execution_" + executionId + "_logs.txt";
            mediaType = MediaType.TEXT_PLAIN_VALUE;
            content = buildLogsText(executionId, logsResponse);
        }

        httpResponse.setContentType(mediaType);
        httpResponse.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");
        httpResponse.getOutputStream().write(content.getBytes(StandardCharsets.UTF_8));
        httpResponse.getOutputStream().flush();
    }

    @PostMapping("/executions/{executionId}/cancel")
    @Operation(summary = "Cancel Execution", description = "Cancel a running execution")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Execution cancelled"),
            @ApiResponse(responseCode = "404", description = "Execution not found"),
            @ApiResponse(responseCode = "400", description = "Execution not cancellable")
    })
    public ResponseEntity<ExecutionResponse> cancelExecution(@PathVariable String executionId) {
        ExecutionResponse response = executionService.cancelExecution(executionId);
        return ResponseEntity.ok(response);
    }

    private String buildLogsJson(String executionId, ExecutionLogsResponse logsResponse) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"execution_id\":\"").append(executionId).append("\",");
        sb.append("\"logs\":[");
        var logs = logsResponse.getLogs();
        for (int i = 0; i < logs.size(); i++) {
            ExecutionLogEntry e = logs.get(i);
            if (i > 0) sb.append(",");
            sb.append("{\"timestamp\":\"").append(e.getTimestamp()).append("\",");
            sb.append("\"level\":\"").append(e.getLevel()).append("\",");
            sb.append("\"node_id\":").append(e.getNodeId() == null ? "null" : "\"" + e.getNodeId() + "\"");
            sb.append(",\"message\":\"").append(escapeJson(e.getMessage())).append("\"}");
        }
        sb.append("],\"total\":").append(logsResponse.getTotal()).append("}");
        return sb.toString();
    }

    private String buildLogsText(String executionId, ExecutionLogsResponse logsResponse) {
        StringBuilder sb = new StringBuilder();
        sb.append("Execution Logs for ").append(executionId).append("\n");
        sb.append("Total Logs: ").append(logsResponse.getTotal()).append("\n");
        sb.append("=".repeat(80)).append("\n\n");
        for (ExecutionLogEntry e : logsResponse.getLogs()) {
            String nodeStr = e.getNodeId() != null ? " [" + e.getNodeId() + "]" : "";
            sb.append("[").append(e.getTimestamp()).append("] ")
                    .append(e.getLevel()).append(nodeStr).append(": ")
                    .append(e.getMessage()).append("\n");
        }
        return sb.toString();
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }
}
