package com.workflow.service;

import com.workflow.dto.WorkflowShareCreate;
import com.workflow.dto.WorkflowShareResponse;
import com.workflow.entity.WorkflowShare;
import com.workflow.repository.UserRepository;
import com.workflow.util.ValidationUtils;
import com.workflow.repository.WorkflowShareRepository;
import com.workflow.util.ErrorMessages;
import com.workflow.util.RepositoryUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * SRP: Workflow sharing operations (share, revoke, list shared).
 * Extracted from SharingService.
 */
@Service
@Transactional
public class WorkflowShareService {
    private final WorkflowShareRepository shareRepository;
    private final UserRepository userRepository;
    private final WorkflowOwnershipService ownershipService;

    public WorkflowShareService(WorkflowShareRepository shareRepository,
                                UserRepository userRepository,
                                WorkflowOwnershipService ownershipService) {
        this.shareRepository = shareRepository;
        this.userRepository = userRepository;
        this.ownershipService = ownershipService;
    }

    @Transactional
    public WorkflowShareResponse shareWorkflow(WorkflowShareCreate create, String userId) {
        ValidationUtils.requireNonEmpty(create.getWorkflowId(), "workflowId");
        ValidationUtils.requireNonEmpty(create.getSharedWithUsername(), "sharedWithUsername");
        var workflow = ownershipService.getWorkflowAndAssertOwner(create.getWorkflowId(), userId);
        var sharedWith = RepositoryUtils.orElseThrow(userRepository.findByUsername(create.getSharedWithUsername()), ErrorMessages.USER_NOT_FOUND);

        var existing = shareRepository.findBySharedWithUserId(sharedWith.getId()).stream()
                .filter(s -> s.getWorkflowId().equals(create.getWorkflowId()))
                .findFirst();
        WorkflowShare share;
        if (existing.isPresent()) {
            share = existing.get();
            share.setPermission(create.getPermission());
            share = shareRepository.save(share);
        } else {
            share = new WorkflowShare();
            share.setId(UUID.randomUUID().toString());
            share.setWorkflowId(create.getWorkflowId());
            share.setSharedWithUserId(sharedWith.getId());
            share.setPermission(create.getPermission());
            share.setSharedBy(userId);
            share = shareRepository.save(share);
        }
        return toShareResponse(share);
    }

    public List<WorkflowShareResponse> getSharedWithMe(String userId) {
        return shareRepository.findBySharedWithUserId(userId).stream()
                .map(this::toShareResponse)
                .collect(Collectors.toList());
    }

    public List<WorkflowShareResponse> getSharedByMe(String userId) {
        return shareRepository.findBySharedBy(userId).stream()
                .map(this::toShareResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void revokeShare(String shareId, String userId) {
        WorkflowShare share = RepositoryUtils.findByIdOrThrow(shareRepository, shareId, ErrorMessages.SHARE_NOT_FOUND);
        ownershipService.getWorkflowAndAssertOwner(share.getWorkflowId(), userId);
        shareRepository.delete(share);
    }

    private WorkflowShareResponse toShareResponse(WorkflowShare s) {
        return new WorkflowShareResponse(s.getId(), s.getWorkflowId(), s.getSharedWithUserId(),
                s.getPermission(), s.getSharedBy(), s.getCreatedAt());
    }
}
