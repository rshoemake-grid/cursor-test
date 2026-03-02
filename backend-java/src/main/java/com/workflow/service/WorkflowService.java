package com.workflow.service;

import com.workflow.dto.WorkflowCreate;
import com.workflow.dto.WorkflowPublishRequest;
import com.workflow.dto.WorkflowResponse;
import com.workflow.dto.WorkflowTemplateResponse;
import com.workflow.entity.Workflow;
import com.workflow.entity.WorkflowTemplate;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.exception.ValidationException;
import com.workflow.repository.WorkflowRepository;
import com.workflow.repository.WorkflowTemplateRepository;
import com.workflow.util.WorkflowMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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
    private final WorkflowTemplateRepository templateRepository;
    private final WorkflowMapper workflowMapper;

    public WorkflowService(WorkflowRepository workflowRepository, WorkflowTemplateRepository templateRepository,
                          WorkflowMapper workflowMapper) {
        this.workflowRepository = workflowRepository;
        this.templateRepository = templateRepository;
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
     * Publish workflow as template
     */
    public WorkflowTemplateResponse publishWorkflow(String workflowId, WorkflowPublishRequest request, String userId, boolean isAdmin) {
        Workflow w = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found: " + workflowId));
        if (!w.getOwnerId().equals(userId)) {
            throw new com.workflow.exception.ForbiddenException("Not authorized to publish this workflow");
        }
        WorkflowTemplate t = new WorkflowTemplate();
        t.setId(UUID.randomUUID().toString());
        t.setName(w.getName());
        t.setDescription(w.getDescription());
        t.setCategory(request.getCategory() != null ? request.getCategory() : "custom");
        t.setTags(request.getTags());
        t.setDefinition(w.getDefinition());
        t.setAuthorId(userId);
        t.setIsOfficial(isAdmin);
        t.setDifficulty(request.getDifficulty() != null ? request.getDifficulty() : "beginner");
        t.setEstimatedTime(request.getEstimatedTime());
        t = templateRepository.save(t);
        return new WorkflowTemplateResponse(t.getId(), t.getName(), t.getDescription(), t.getCategory(), t.getTags(),
                t.getDifficulty(), t.getEstimatedTime(), t.getIsOfficial(), t.getUsesCount(), t.getLikesCount(), t.getRating(),
                t.getAuthorId(), null, t.getThumbnailUrl(), t.getPreviewImageUrl(), t.getCreatedAt(), t.getUpdatedAt());
    }

    /**
     * Bulk delete workflows (only those owned by user)
     */
    public Map<String, Object> bulkDelete(List<String> workflowIds, String userId) {
        if (workflowIds == null || workflowIds.isEmpty()) {
            throw new ValidationException("No workflow IDs provided");
        }
        int deleted = 0;
        List<String> failed = new java.util.ArrayList<>();
        for (String id : workflowIds) {
            try {
                Workflow w = workflowRepository.findById(id).orElse(null);
                if (w != null && userId != null && userId.equals(w.getOwnerId())) {
                    workflowRepository.deleteById(id);
                    deleted++;
                } else {
                    failed.add(id);
                }
            } catch (Exception e) {
                failed.add(id);
            }
        }
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("deleted_count", deleted);
        if (!failed.isEmpty()) {
            result.put("message", "Deleted " + deleted + " workflow(s). " + failed.size() + " could not be deleted.");
            result.put("failed_ids", failed);
        } else {
            result.put("message", "Successfully deleted " + deleted + " workflow(s)");
        }
        return result;
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
