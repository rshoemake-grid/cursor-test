package com.workflow.service;

import com.workflow.entity.Execution;
import com.workflow.entity.Workflow;
import com.workflow.repository.ExecutionRepository;
import com.workflow.repository.WorkflowRepository;
import com.workflow.util.RepositoryUtils;
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

    public ExecutionExportService(ExecutionRepository executionRepository, WorkflowRepository workflowRepository) {
        this.executionRepository = executionRepository;
        this.workflowRepository = workflowRepository;
    }

    public Map<String, Object> exportExecution(String executionId) {
        Execution e = RepositoryUtils.findByIdOrThrow(executionRepository, executionId, "Execution not found");
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

        Map<String, Object> wfData = new HashMap<>();
        wfData.put("id", w != null ? w.getId() : null);
        wfData.put("name", w != null ? w.getName() : null);
        wfData.put("definition", w != null ? w.getDefinition() : null);
        result.put("workflow", wfData);

        return result;
    }
}
