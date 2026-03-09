package com.workflow.service;

import com.workflow.dto.WorkflowShareCreate;
import com.workflow.dto.WorkflowShareResponse;
import com.workflow.dto.WorkflowVersionCreate;
import com.workflow.dto.WorkflowVersionResponse;
import com.workflow.entity.WorkflowShare;
import com.workflow.entity.WorkflowVersion;
import com.workflow.exception.ForbiddenException;
import com.workflow.repository.UserRepository;
import com.workflow.repository.WorkflowRepository;
import com.workflow.repository.WorkflowShareRepository;
import com.workflow.repository.WorkflowVersionRepository;
import com.workflow.util.ErrorMessages;
import com.workflow.util.RepositoryUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Sharing service - matches Python sharing_routes
 */
@Service
@Transactional
public class SharingService {
    private final WorkflowShareRepository shareRepository;
    private final WorkflowVersionRepository versionRepository;
    private final WorkflowRepository workflowRepository;
    private final UserRepository userRepository;
    private final WorkflowOwnershipService ownershipService;

    public SharingService(WorkflowShareRepository shareRepository, WorkflowVersionRepository versionRepository,
                         WorkflowRepository workflowRepository, UserRepository userRepository,
                         WorkflowOwnershipService ownershipService) {
        this.shareRepository = shareRepository;
        this.versionRepository = versionRepository;
        this.workflowRepository = workflowRepository;
        this.userRepository = userRepository;
        this.ownershipService = ownershipService;
    }

    @Transactional
    public WorkflowShareResponse shareWorkflow(WorkflowShareCreate create, String userId) {
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

    @Transactional
    public WorkflowVersionResponse createVersion(WorkflowVersionCreate create, String userId) {
        var workflow = ownershipService.getWorkflowAndAssertOwner(create.getWorkflowId(), userId);
        var latest = versionRepository.findByWorkflowIdOrderByVersionNumberDesc(create.getWorkflowId())
                .stream().findFirst();
        int nextVersion = latest.map(v -> v.getVersionNumber() + 1).orElse(1);

        WorkflowVersion v = new WorkflowVersion();
        v.setId(UUID.randomUUID().toString());
        v.setWorkflowId(create.getWorkflowId());
        v.setVersionNumber(nextVersion);
        v.setDefinition(workflow.getDefinition());
        v.setChangeNotes(create.getChangeNotes());
        v.setCreatedBy(userId);
        v = versionRepository.save(v);
        return new WorkflowVersionResponse(v.getId(), v.getWorkflowId(), v.getVersionNumber(),
                v.getChangeNotes(), v.getCreatedBy(), v.getCreatedAt());
    }

    public List<WorkflowVersionResponse> getVersions(String workflowId, String userId) {
        var workflow = RepositoryUtils.findByIdOrThrow(workflowRepository, workflowId, ErrorMessages.WORKFLOW_NOT_FOUND);
        ownershipService.assertCanReadOrShare(workflow, userId);
        return versionRepository.findByWorkflowIdOrderByVersionNumberDesc(workflowId).stream()
                .map(v -> new WorkflowVersionResponse(v.getId(), v.getWorkflowId(), v.getVersionNumber(),
                        v.getChangeNotes(), v.getCreatedBy(), v.getCreatedAt()))
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, String> restoreVersion(String versionId, String userId) {
        WorkflowVersion v = RepositoryUtils.findByIdOrThrow(versionRepository, versionId, ErrorMessages.VERSION_NOT_FOUND);
        var workflow = ownershipService.getWorkflowAndAssertOwner(v.getWorkflowId(), userId);
        workflow.setDefinition(v.getDefinition());
        workflowRepository.save(workflow);
        return Map.of("message", "Restored to version " + v.getVersionNumber());
    }

    private WorkflowShareResponse toShareResponse(WorkflowShare s) {
        return new WorkflowShareResponse(s.getId(), s.getWorkflowId(), s.getSharedWithUserId(),
                s.getPermission(), s.getSharedBy(), s.getCreatedAt());
    }
}
