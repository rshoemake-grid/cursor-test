package com.workflow.repository;

import com.workflow.entity.WorkflowShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowShareRepository extends JpaRepository<WorkflowShare, String> {
    List<WorkflowShare> findBySharedWithUserId(String sharedWithUserId);
    List<WorkflowShare> findBySharedBy(String sharedBy);
}
