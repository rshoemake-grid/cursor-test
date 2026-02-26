package com.workflow.repository;

import com.workflow.entity.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, String> {
    List<Workflow> findByOwnerId(String ownerId);
    List<Workflow> findByIsPublicTrue();
    List<Workflow> findByIsTemplateTrue();
    List<Workflow> findByCategory(String category);
    
    @Query("SELECT w FROM Workflow w WHERE w.ownerId = :ownerId OR w.isPublic = true")
    List<Workflow> findAccessibleWorkflows(@Param("ownerId") String ownerId);
}
