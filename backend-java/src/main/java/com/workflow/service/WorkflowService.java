package com.workflow.service;

import com.workflow.config.TemplateConfig;
import com.workflow.dto.BulkDeleteResult;
import com.workflow.dto.WorkflowCreate;
import com.workflow.dto.WorkflowPublishRequest;
import com.workflow.dto.WorkflowResponse;
import com.workflow.dto.WorkflowTemplateResponse;
import com.workflow.entity.Workflow;
import com.workflow.entity.WorkflowTemplate;
import com.workflow.exception.ForbiddenException;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.exception.ValidationException;
import com.workflow.repository.WorkflowRepository;
import com.workflow.util.ErrorMessages;
import com.workflow.util.ObjectUtils;
import com.workflow.util.RepositoryUtils;
import com.workflow.util.TemplateFactory;
import com.workflow.util.ValidationUtils;
import com.workflow.util.WorkflowFactory;
import com.workflow.repository.WorkflowTemplateRepository;
import com.workflow.util.TemplateMapper;
import com.workflow.util.WorkflowMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
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
    private final WorkflowOwnershipService ownershipService;
    private final TemplateConfig.TemplateOptions templateOptions;

    public WorkflowService(WorkflowRepository workflowRepository, WorkflowTemplateRepository templateRepository,
                          WorkflowMapper workflowMapper, WorkflowOwnershipService ownershipService,
                          TemplateConfig.TemplateOptions templateOptions) {
        this.workflowRepository = workflowRepository;
        this.templateRepository = templateRepository;
        this.workflowMapper = workflowMapper;
        this.ownershipService = ownershipService;
        this.templateOptions = templateOptions;
    }
    
    /**
     * Create a new workflow
     */
    public WorkflowResponse createWorkflow(WorkflowCreate workflowCreate, String userId) {
        validateWorkflowCreate(workflowCreate);
        
        log.info("Creating workflow: {} for user: {}", workflowCreate.getName(), userId);

        Workflow workflow = WorkflowFactory.create(userId, workflowCreate.getName(), workflowCreate.getDescription(),
                workflowMapper.buildDefinition(workflowCreate),
                workflowCreate.getVersion(), null, null);
        workflow.setCreatedAt(LocalDateTime.now());
        workflow.setUpdatedAt(LocalDateTime.now());

        Workflow saved = workflowRepository.save(workflow);
        log.debug("Created workflow with ID: {}", saved.getId());
        
        return workflowMapper.toResponse(saved);
    }
    
    /**
     * Get workflow by ID. S-C1: Requires ownership or public access.
     */
    @Transactional(readOnly = true)
    public WorkflowResponse getWorkflow(String id, String userId) {
        log.debug("Fetching workflow: {} for user: {}", id, userId);
        Workflow workflow = RepositoryUtils.findByIdOrThrow(workflowRepository, id, ErrorMessages.workflowNotFound(id));
        ownershipService.assertCanRead(workflow, userId);
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
     * Update workflow. S-C1: Requires ownership.
     */
    public WorkflowResponse updateWorkflow(String id, WorkflowCreate workflowCreate, String userId) {
        validateWorkflowCreate(workflowCreate);

        log.info("Updating workflow: {} by user: {}", id, userId);

        Workflow workflow = ownershipService.getWorkflowAndAssertOwner(id, userId);

        workflow.setName(workflowCreate.getName());
        workflow.setDescription(workflowCreate.getDescription());
        workflow.setVersion(ObjectUtils.orDefault(workflowCreate.getVersion(), workflow.getVersion()));
        workflow.setDefinition(workflowMapper.buildDefinition(workflowCreate));
        workflow.setUpdatedAt(LocalDateTime.now());
        
        Workflow saved = workflowRepository.save(workflow);
        log.debug("Updated workflow: {}", id);
        
        return workflowMapper.toResponse(saved);
    }
    
    /**
     * Delete workflow. S-C1: Requires ownership.
     */
    public void deleteWorkflow(String id, String userId) {
        log.info("Deleting workflow: {} by user: {}", id, userId);

        ownershipService.getWorkflowAndAssertOwner(id, userId);

        workflowRepository.deleteById(id);
        log.debug("Deleted workflow: {}", id);
    }

    /**
     * Publish workflow as template
     */
    public WorkflowTemplateResponse publishWorkflow(String workflowId, WorkflowPublishRequest request, String userId, boolean isAdmin) {
        Workflow w = ownershipService.getWorkflowAndAssertOwner(workflowId, userId);
        WorkflowTemplate t = TemplateFactory.fromWorkflow(w, request, userId, isAdmin,
                templateOptions.getDefaultCategory(), templateOptions.getDefaultDifficulty());
        t = templateRepository.save(t);
        return TemplateMapper.toResponse(t, null);
    }

    /**
     * Bulk delete workflows (only those owned by user).
     * Requires non-null userId (caller must use extractUserIdRequired).
     */
    public Map<String, Object> bulkDelete(List<String> workflowIds, String userId) {
        if (workflowIds == null || workflowIds.isEmpty()) {
            throw new ValidationException(ErrorMessages.BULK_DELETE_NO_IDS);
        }
        if (userId == null) {
            throw new ValidationException(ErrorMessages.BULK_DELETE_AUTH_REQUIRED);
        }
        int deleted = 0;
        List<String> failed = new ArrayList<>();
        for (String id : workflowIds) {
            try {
                Workflow w = workflowRepository.findById(id).orElse(null);
                if (w != null) {
                    ownershipService.assertOwner(w, userId);
                    workflowRepository.deleteById(id);
                    deleted++;
                } else {
                    failed.add(id);
                }
            } catch (ForbiddenException | ResourceNotFoundException e) {
                failed.add(id);
            }
        }
        return new BulkDeleteResult(deleted, failed).toMap();
    }

    /**
     * Validate WorkflowCreate DTO
     */
    private void validateWorkflowCreate(WorkflowCreate workflowCreate) {
        ValidationUtils.requireNonNull(workflowCreate, "Workflow data");
        ValidationUtils.requireNonEmpty(workflowCreate.getName(), "Workflow name");
        ValidationUtils.requireNonNull(workflowCreate.getNodes(), "Workflow nodes");
        ValidationUtils.requireNonNull(workflowCreate.getEdges(), "Workflow edges");
    }
}
