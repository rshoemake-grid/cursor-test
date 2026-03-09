package com.workflow.service;

import com.workflow.entity.Workflow;
import com.workflow.entity.WorkflowLike;
import com.workflow.repository.WorkflowLikeRepository;
import com.workflow.util.ErrorMessages;
import com.workflow.util.ObjectUtils;
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
        Workflow workflow = RepositoryUtils.findByIdOrThrow(workflowRepository, workflowId, ErrorMessages.workflowNotFound(workflowId));
        ownershipService.assertCanRead(workflow, userId);
        if (workflowLikeRepository.findByWorkflowIdAndUserId(workflowId, userId).isPresent()) {
            return Map.of("message", "Already liked");
        }
        WorkflowLike like = new WorkflowLike();
        like.setId(UUID.randomUUID().toString());
        like.setWorkflowId(workflowId);
        like.setUserId(userId);
        workflowLikeRepository.save(like);
        workflow.setLikesCount(incrementLikesCount(workflow.getLikesCount()));
        workflowRepository.save(workflow);
        return Map.of("message", "Liked successfully");
    }

    @Transactional
    public void unlikeWorkflow(String workflowId, String userId) {
        Workflow workflow = RepositoryUtils.findByIdOrThrow(workflowRepository, workflowId, ErrorMessages.workflowNotFound(workflowId));
        ownershipService.assertCanRead(workflow, userId);
        RepositoryUtils.orElseThrow(workflowLikeRepository.findByWorkflowIdAndUserId(workflowId, userId), ErrorMessages.LIKE_NOT_FOUND);
        workflowLikeRepository.deleteByWorkflowIdAndUserId(workflowId, userId);
        workflowRepository.findById(workflowId).ifPresent(w -> {
            w.setLikesCount(decrementLikesCount(w.getLikesCount()));
            workflowRepository.save(w);
        });
    }

    private static int incrementLikesCount(Integer current) {
        return ObjectUtils.orDefaultInt(current, 0) + 1;
    }

    private static int decrementLikesCount(Integer current) {
        return Math.max(0, ObjectUtils.orDefaultInt(current, 0) - 1);
    }
}
