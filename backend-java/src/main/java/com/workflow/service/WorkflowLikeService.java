package com.workflow.service;

import com.workflow.entity.Workflow;
import com.workflow.entity.WorkflowLike;
import com.workflow.repository.WorkflowLikeRepository;
import com.workflow.util.RepositoryUtils;
import com.workflow.repository.WorkflowRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * SRP-4: Workflow like/unlike logic extracted from MarketplaceService.
 */
@Service
public class WorkflowLikeService {
    private final WorkflowRepository workflowRepository;
    private final WorkflowLikeRepository workflowLikeRepository;
    private final WorkflowOwnershipService ownershipService;

    public WorkflowLikeService(WorkflowRepository workflowRepository,
                               WorkflowLikeRepository workflowLikeRepository,
                               WorkflowOwnershipService ownershipService) {
        this.workflowRepository = workflowRepository;
        this.workflowLikeRepository = workflowLikeRepository;
        this.ownershipService = ownershipService;
    }

    @Transactional
    public Map<String, String> likeWorkflow(String workflowId, String userId) {
        Workflow workflow = RepositoryUtils.findByIdOrThrow(workflowRepository, workflowId, "Workflow not found");
        ownershipService.assertCanRead(workflow, userId);
        if (workflowLikeRepository.findByWorkflowIdAndUserId(workflowId, userId).isPresent()) {
            return Map.of("message", "Already liked");
        }
        WorkflowLike like = new WorkflowLike();
        like.setId(UUID.randomUUID().toString());
        like.setWorkflowId(workflowId);
        like.setUserId(userId);
        workflowLikeRepository.save(like);
        workflow.setLikesCount(Objects.requireNonNullElse(workflow.getLikesCount(), 0) + 1);
        workflowRepository.save(workflow);
        return Map.of("message", "Liked successfully");
    }

    @Transactional
    public void unlikeWorkflow(String workflowId, String userId) {
        Workflow workflow = RepositoryUtils.findByIdOrThrow(workflowRepository, workflowId, "Workflow not found");
        ownershipService.assertCanRead(workflow, userId);
        RepositoryUtils.orElseThrow(workflowLikeRepository.findByWorkflowIdAndUserId(workflowId, userId), "Like not found");
        workflowLikeRepository.deleteByWorkflowIdAndUserId(workflowId, userId);
        workflowRepository.findById(workflowId).ifPresent(w -> {
            w.setLikesCount(Math.max(0, Objects.requireNonNullElse(w.getLikesCount(), 0) - 1));
            workflowRepository.save(w);
        });
    }
}
