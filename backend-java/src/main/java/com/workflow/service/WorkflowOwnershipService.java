package com.workflow.service;

import com.workflow.entity.Workflow;
import com.workflow.entity.WorkflowShare;
import com.workflow.exception.ForbiddenException;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.repository.WorkflowRepository;
import com.workflow.repository.WorkflowShareRepository;
import com.workflow.util.RepositoryUtils;
import org.springframework.stereotype.Service;

/**
 * DRY-1: Centralized workflow ownership and access checks.
 * S-C1: Prevents IDOR - users can only access workflows they own or have share access to.
 */
@Service
public class WorkflowOwnershipService {
    private final WorkflowRepository workflowRepository;
    private final WorkflowShareRepository shareRepository;

    public WorkflowOwnershipService(WorkflowRepository workflowRepository,
                                    WorkflowShareRepository shareRepository) {
        this.workflowRepository = workflowRepository;
        this.shareRepository = shareRepository;
    }

    /**
     * Assert that the user owns the workflow. Throws ForbiddenException if not.
     */
    public void assertOwner(Workflow workflow, String userId) {
        if (workflow == null) {
            throw new ResourceNotFoundException("Workflow not found");
        }
        if (userId == null || !workflow.getOwnerId().equals(userId)) {
            throw new ForbiddenException("Not authorized to access this workflow");
        }
    }

    /**
     * Get workflow and assert ownership. Throws if not found or not owner.
     */
    public Workflow getWorkflowAndAssertOwner(String workflowId, String userId) {
        Workflow workflow = RepositoryUtils.findByIdOrThrow(workflowRepository, workflowId, "Workflow not found: " + workflowId);
        assertOwner(workflow, userId);
        return workflow;
    }

    /**
     * Assert user can read workflow (owner or public).
     */
    public void assertCanRead(Workflow workflow, String userId) {
        if (workflow == null) {
            throw new ResourceNotFoundException("Workflow not found");
        }
        if (Boolean.TRUE.equals(workflow.getIsPublic())) {
            return;
        }
        if (userId == null || !workflow.getOwnerId().equals(userId)) {
            throw new ForbiddenException("Not authorized to access this workflow");
        }
    }

    /**
     * Assert user can read workflow (owner, public, or shared with user).
     */
    public void assertCanReadOrShare(Workflow workflow, String userId) {
        if (workflow == null) {
            throw new ResourceNotFoundException("Workflow not found");
        }
        if (Boolean.TRUE.equals(workflow.getIsPublic())) {
            return;
        }
        if (workflow.getOwnerId() != null && workflow.getOwnerId().equals(userId)) {
            return;
        }
        boolean hasShare = userId != null && shareRepository.findBySharedWithUserId(userId).stream()
                .anyMatch(s -> workflow.getId().equals(s.getWorkflowId()));
        if (!hasShare) {
            throw new ForbiddenException("Not authorized to access this workflow");
        }
    }
}
