package com.workflow.service;

import com.workflow.exception.ExecutionNotFoundException;
import com.workflow.entity.Execution;
import com.workflow.entity.Workflow;
import com.workflow.repository.ExecutionRepository;
import com.workflow.repository.WorkflowRepository;
import com.workflow.util.ErrorMessages;
import com.workflow.util.RepositoryUtils;
import com.workflow.util.WorkflowExportMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * SRP-1: Execution export logic extracted from DebugController.
 */
@Service
public class ExecutionExportService {
    private final ExecutionRepository executionRepository;
    private final WorkflowRepository workflowRepository;
    private final ExecutionService executionService;

    public ExecutionExportService(ExecutionRepository executionRepository, WorkflowRepository workflowRepository,
                                  ExecutionService executionService) {
        this.executionRepository = executionRepository;
        this.workflowRepository = workflowRepository;
        this.executionService = executionService;
    }

    public Map<String, Object> exportExecution(String executionId, String userId) {
        executionService.requireExecutionOwner(executionId, userId);
        Execution e = RepositoryUtils.findByIdOrThrow(executionRepository, executionId,
                () -> new ExecutionNotFoundException(ErrorMessages.executionNotFound(executionId)));
        Workflow w = workflowRepository.findById(e.getWorkflowId()).orElse(null);

        Map<String, Object> result = new HashMap<>();
        result.put("export_version", "1.0");
        result.put("exported_at", LocalDateTime.now());

        Map<String, Object> execData = new HashMap<>();
        execData.put("id", e.getId());
        execData.put("workflow_id", e.getWorkflowId());
        execData.put("status", e.getStatus());
        execData.put("started_at", e.getStartedAt());
        execData.put("completed_at", e.getCompletedAt());
        execData.put("state", e.getState());
        result.put("execution", execData);

        result.put("workflow", WorkflowExportMapper.toMinimalExportMap(w));

        return result;
    }
}
