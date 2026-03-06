package com.workflow.service;

import com.workflow.repository.UserRepository;
import com.workflow.repository.WorkflowRepository;
import com.workflow.repository.WorkflowTemplateRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * SRP-4: Marketplace statistics extracted from MarketplaceService.
 */
@Service
public class MarketplaceStatsService {
    private final WorkflowRepository workflowRepository;
    private final WorkflowTemplateRepository templateRepository;
    private final UserRepository userRepository;

    public MarketplaceStatsService(WorkflowRepository workflowRepository,
                                  WorkflowTemplateRepository templateRepository,
                                  UserRepository userRepository) {
        this.workflowRepository = workflowRepository;
        this.templateRepository = templateRepository;
        this.userRepository = userRepository;
    }

    public Map<String, Object> getStats() {
        long publicCount = workflowRepository.findByIsPublicTrue().size();
        long templateCount = templateRepository.count();
        long userCount = userRepository.count();
        int totalExecutions = workflowRepository.findAll().stream()
                .mapToInt(w -> w.getUsesCount() != null ? w.getUsesCount() : 0)
                .sum();
        Map<String, Object> stats = new HashMap<>();
        stats.put("public_workflows", publicCount);
        stats.put("templates", templateCount);
        stats.put("total_users", userCount);
        stats.put("total_executions", totalExecutions);
        return stats;
    }
}
