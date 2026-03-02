package com.workflow.repository;

import com.workflow.entity.WorkflowTemplate;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowTemplateRepository extends JpaRepository<WorkflowTemplate, String> {
    List<WorkflowTemplate> findByCategory(String category);
    List<WorkflowTemplate> findByIsOfficialTrue();

    @Query("SELECT t FROM WorkflowTemplate t WHERE (:category IS NULL OR t.category = :category) " +
            "AND (:difficulty IS NULL OR t.difficulty = :difficulty)")
    List<WorkflowTemplate> findWithFilters(@Param("category") String category, @Param("difficulty") String difficulty, Pageable pageable);
}
