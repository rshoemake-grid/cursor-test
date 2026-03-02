package com.workflow.repository;

import com.workflow.entity.WorkflowLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowLikeRepository extends JpaRepository<WorkflowLike, String> {
    Optional<WorkflowLike> findByWorkflowIdAndUserId(String workflowId, String userId);
    List<WorkflowLike> findByUserId(String userId);
    void deleteByWorkflowIdAndUserId(String workflowId, String userId);
}
