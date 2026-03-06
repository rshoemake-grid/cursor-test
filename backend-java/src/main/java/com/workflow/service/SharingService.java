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

    public SharingService(WorkflowShareRepository shareRepository, WorkflowVersionRepository versionRepository,
                         WorkflowRepository workflowRepository, UserRepository userRepository) {
        this.shareRepository = shareRepository;
        this.versionRepository = versionRepository;
        this.workflowRepository = workflowRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public WorkflowShareResponse shareWorkflow(WorkflowShareCreate create, String userId) {
        var workflow = RepositoryUtils.findByIdOrThrow(workflowRepository, create.getWorkflowId(), "Workflow not found");
        if (!workflow.getOwnerId().equals(userId)) {
            throw new ForbiddenException("Not authorized to share this workflow");
        }
        var sharedWith = RepositoryUtils.orElseThrow(userRepository.findByUsername(create.getSharedWithUsername()), "User not found");

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
        WorkflowShare share = RepositoryUtils.findByIdOrThrow(shareRepository, shareId, "Share not found");
        var workflow = workflowRepository.findById(share.getWorkflowId()).orElse(null);
        if (workflow == null || !workflow.getOwnerId().equals(userId)) {
            throw new ForbiddenException("Not authorized");
        }
        shareRepository.delete(share);
    }

    @Transactional
    public WorkflowVersionResponse createVersion(WorkflowVersionCreate create, String userId) {
        var workflow = RepositoryUtils.findByIdOrThrow(workflowRepository, create.getWorkflowId(), "Workflow not found");
        if (!workflow.getOwnerId().equals(userId)) {
            throw new ForbiddenException("Not authorized");
        }
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
        var workflow = RepositoryUtils.findByIdOrThrow(workflowRepository, workflowId, "Workflow not found");
        if (!workflow.getOwnerId().equals(userId)) {
            var hasShare = shareRepository.findBySharedWithUserId(userId).stream()
                    .anyMatch(s -> s.getWorkflowId().equals(workflowId));
            if (!hasShare) throw new ForbiddenException("Not authorized");
        }
        return versionRepository.findByWorkflowIdOrderByVersionNumberDesc(workflowId).stream()
                .map(v -> new WorkflowVersionResponse(v.getId(), v.getWorkflowId(), v.getVersionNumber(),
                        v.getChangeNotes(), v.getCreatedBy(), v.getCreatedAt()))
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, String> restoreVersion(String versionId, String userId) {
        WorkflowVersion v = RepositoryUtils.findByIdOrThrow(versionRepository, versionId, "Version not found");
        var workflow = RepositoryUtils.findByIdOrThrow(workflowRepository, v.getWorkflowId(), "Workflow not found");
        if (!workflow.getOwnerId().equals(userId)) {
            throw new ForbiddenException("Not authorized");
        }
        workflow.setDefinition(v.getDefinition());
        workflowRepository.save(workflow);
        return Map.of("message", "Restored to version " + v.getVersionNumber());
    }

    private WorkflowShareResponse toShareResponse(WorkflowShare s) {
        return new WorkflowShareResponse(s.getId(), s.getWorkflowId(), s.getSharedWithUserId(),
                s.getPermission(), s.getSharedBy(), s.getCreatedAt());
    }
}
