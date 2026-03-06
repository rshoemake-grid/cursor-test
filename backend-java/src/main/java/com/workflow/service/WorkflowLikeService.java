package com.workflow.service;

import com.workflow.entity.Workflow;
import com.workflow.entity.WorkflowLike;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.repository.WorkflowLikeRepository;
import com.workflow.repository.WorkflowRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

/**
 * SRP-4: Workflow like/unlike logic extracted from MarketplaceService.
 */
@Service
public class WorkflowLikeService {
    private final WorkflowRepository workflowRepository;
    private final WorkflowLikeRepository workflowLikeRepository;

    public WorkflowLikeService(WorkflowRepository workflowRepository,
                               WorkflowLikeRepository workflowLikeRepository) {
        this.workflowRepository = workflowRepository;
        this.workflowLikeRepository = workflowLikeRepository;
    }

    @Transactional
    public Map<String, String> likeWorkflow(String workflowId, String userId) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));
        if (workflowLikeRepository.findByWorkflowIdAndUserId(workflowId, userId).isPresent()) {
            return Map.of("message", "Already liked");
        }
        WorkflowLike like = new WorkflowLike();
        like.setId(UUID.randomUUID().toString());
        like.setWorkflowId(workflowId);
        like.setUserId(userId);
        workflowLikeRepository.save(like);
        workflow.setLikesCount((workflow.getLikesCount() != null ? workflow.getLikesCount() : 0) + 1);
        workflowRepository.save(workflow);
        return Map.of("message", "Liked successfully");
    }

    @Transactional
    public void unlikeWorkflow(String workflowId, String userId) {
        workflowLikeRepository.findByWorkflowIdAndUserId(workflowId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Like not found"));
        workflowLikeRepository.deleteByWorkflowIdAndUserId(workflowId, userId);
        workflowRepository.findById(workflowId).ifPresent(w -> {
            w.setLikesCount(Math.max(0, (w.getLikesCount() != null ? w.getLikesCount() : 0) - 1));
            workflowRepository.save(w);
        });
    }
}
