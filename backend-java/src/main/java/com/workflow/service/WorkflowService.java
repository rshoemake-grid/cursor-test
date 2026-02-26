package com.workflow.service;

import com.workflow.dto.WorkflowCreate;
import com.workflow.dto.WorkflowResponse;
import com.workflow.entity.Workflow;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.exception.ValidationException;
import com.workflow.repository.WorkflowRepository;
import com.workflow.util.WorkflowMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.workflow.constants.WorkflowConstants.DEFAULT_VERSION;

/**
 * Service for workflow business logic
 * SRP: Handles all workflow-related business operations
 */
@Service
@Transactional
public class WorkflowService {
    private static final Logger log = LoggerFactory.getLogger(WorkflowService.class);
    
    private final WorkflowRepository workflowRepository;
    private final WorkflowMapper workflowMapper;
    
    public WorkflowService(WorkflowRepository workflowRepository, WorkflowMapper workflowMapper) {
        this.workflowRepository = workflowRepository;
        this.workflowMapper = workflowMapper;
    }
    
    /**
     * Create a new workflow
     */
    public WorkflowResponse createWorkflow(WorkflowCreate workflowCreate, String userId) {
        validateWorkflowCreate(workflowCreate);
        
        log.info("Creating workflow: {} for user: {}", workflowCreate.getName(), userId);
        
        Workflow workflow = new Workflow();
        workflow.setId(UUID.randomUUID().toString());
        workflow.setName(workflowCreate.getName());
        workflow.setDescription(workflowCreate.getDescription());
        workflow.setVersion(workflowCreate.getVersion() != null ? workflowCreate.getVersion() : DEFAULT_VERSION);
        workflow.setOwnerId(userId);
        workflow.setIsPublic(false);
        workflow.setIsTemplate(false);
        workflow.setDefinition(workflowMapper.buildDefinition(workflowCreate));
        workflow.setCreatedAt(LocalDateTime.now());
        workflow.setUpdatedAt(LocalDateTime.now());
        
        Workflow saved = workflowRepository.save(workflow);
        log.debug("Created workflow with ID: {}", saved.getId());
        
        return workflowMapper.toResponse(saved);
    }
    
    /**
     * Get workflow by ID
     */
    @Transactional(readOnly = true)
    public WorkflowResponse getWorkflow(String id) {
        log.debug("Fetching workflow: {}", id);
        Workflow workflow = workflowRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Workflow not found: " + id));
        
        return workflowMapper.toResponse(workflow);
    }
    
    /**
     * List workflows accessible to user
     */
    @Transactional(readOnly = true)
    public List<WorkflowResponse> listWorkflows(String userId) {
        log.debug("Listing workflows for user: {}", userId);
        
        List<Workflow> workflows;
        if (userId != null) {
            workflows = workflowRepository.findAccessibleWorkflows(userId);
        } else {
            workflows = workflowRepository.findByIsPublicTrue();
        }
        
        return workflows.stream()
            .map(workflowMapper::toResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Update workflow
     */
    public WorkflowResponse updateWorkflow(String id, WorkflowCreate workflowCreate) {
        validateWorkflowCreate(workflowCreate);
        
        log.info("Updating workflow: {}", id);
        
        Workflow workflow = workflowRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Workflow not found: " + id));
        
        workflow.setName(workflowCreate.getName());
        workflow.setDescription(workflowCreate.getDescription());
        workflow.setVersion(workflowCreate.getVersion() != null ? workflowCreate.getVersion() : workflow.getVersion());
        workflow.setDefinition(workflowMapper.buildDefinition(workflowCreate));
        workflow.setUpdatedAt(LocalDateTime.now());
        
        Workflow saved = workflowRepository.save(workflow);
        log.debug("Updated workflow: {}", id);
        
        return workflowMapper.toResponse(saved);
    }
    
    /**
     * Delete workflow
     */
    public void deleteWorkflow(String id) {
        log.info("Deleting workflow: {}", id);
        
        if (!workflowRepository.existsById(id)) {
            throw new ResourceNotFoundException("Workflow not found: " + id);
        }
        
        workflowRepository.deleteById(id);
        log.debug("Deleted workflow: {}", id);
    }
    
    /**
     * Validate WorkflowCreate DTO
     */
    private void validateWorkflowCreate(WorkflowCreate workflowCreate) {
        if (workflowCreate == null) {
            throw new ValidationException("Workflow data is required");
        }
        if (workflowCreate.getName() == null || workflowCreate.getName().trim().isEmpty()) {
            throw new ValidationException("Workflow name is required");
        }
        if (workflowCreate.getNodes() == null) {
            throw new ValidationException("Workflow nodes are required");
        }
        if (workflowCreate.getEdges() == null) {
            throw new ValidationException("Workflow edges are required");
        }
    }
}
