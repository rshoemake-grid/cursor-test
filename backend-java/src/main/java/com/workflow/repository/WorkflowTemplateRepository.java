package com.workflow.repository;

import com.workflow.entity.WorkflowTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowTemplateRepository extends JpaRepository<WorkflowTemplate, String> {
    List<WorkflowTemplate> findByCategory(String category);
    List<WorkflowTemplate> findByIsOfficialTrue();
}
