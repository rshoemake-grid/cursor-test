package com.workflow.service;

import com.workflow.dto.WorkflowVersionCreate;
import com.workflow.dto.WorkflowVersionResponse;
import com.workflow.entity.WorkflowVersion;
import com.workflow.repository.WorkflowRepository;
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
 * SRP: Workflow version operations (create, list, restore).
 * Extracted from SharingService.
 */
@Service
@Transactional
public class WorkflowVersionService {
    private final WorkflowVersionRepository versionRepository;
    private final WorkflowRepository workflowRepository;
    private final WorkflowOwnershipService ownershipService;

    public WorkflowVersionService(WorkflowVersionRepository versionRepository,
                                  WorkflowRepository workflowRepository,
                                  WorkflowOwnershipService ownershipService) {
        this.versionRepository = versionRepository;
        this.workflowRepository = workflowRepository;
        this.ownershipService = ownershipService;
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
        var workflow = RepositoryUtils.findByIdOrThrow(workflowRepository, workflowId, ErrorMessages.workflowNotFound(workflowId));
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
        return Map.of(ErrorMessages.RESTORE_MESSAGE_KEY, ErrorMessages.RESTORED_TO_VERSION_PREFIX + v.getVersionNumber());
    }
}
