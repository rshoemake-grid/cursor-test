package com.workflow.repository;

import com.workflow.entity.Workflow;
import org.springframework.data.domain.Pageable;
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

    @Query("SELECT w FROM Workflow w WHERE w.ownerId = :userId OR w.isPublic = true " +
           "OR EXISTS (SELECT 1 FROM WorkflowShare ws WHERE ws.workflowId = w.id AND ws.sharedWithUserId = :userId)")
    List<Workflow> findAccessibleWorkflows(@Param("userId") String userId);

    @Query("SELECT w FROM Workflow w WHERE (w.isPublic = true OR w.isTemplate = true)")
    List<Workflow> findPublicOrTemplateWorkflows(Pageable pageable);

    List<Workflow> findByIdIn(List<String> ids);

    /** Workflows visible to marketplace discover (matches Python seed guard). */
    @Query("SELECT COUNT(w) FROM Workflow w WHERE w.isPublic = true OR w.isTemplate = true")
    long countDiscoverableMarketplaceWorkflows();
}
