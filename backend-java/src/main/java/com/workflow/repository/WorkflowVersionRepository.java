package com.workflow.repository;

import com.workflow.entity.WorkflowVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowVersionRepository extends JpaRepository<WorkflowVersion, String> {
    List<WorkflowVersion> findByWorkflowIdOrderByVersionNumberDesc(String workflowId);
}
