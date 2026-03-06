package com.workflow.service;

import com.workflow.dto.WorkflowResponseV2;
import com.workflow.entity.Workflow;
import com.workflow.entity.WorkflowLike;
import com.workflow.repository.WorkflowLikeRepository;
import com.workflow.repository.WorkflowRepository;
import com.workflow.util.SortStrategy;
import com.workflow.util.WorkflowMapper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * SRP-4: Workflow discovery and browsing extracted from MarketplaceService.
 */
@Service
public class WorkflowDiscoveryService {
    private final WorkflowRepository workflowRepository;
    private final WorkflowLikeRepository workflowLikeRepository;
    private final WorkflowMapper workflowMapper;
    private final SortStrategy workflowSortStrategy;

    public WorkflowDiscoveryService(WorkflowRepository workflowRepository,
                                   WorkflowLikeRepository workflowLikeRepository,
                                   WorkflowMapper workflowMapper,
                                   @Qualifier("workflowSortStrategy") SortStrategy workflowSortStrategy) {
        this.workflowRepository = workflowRepository;
        this.workflowLikeRepository = workflowLikeRepository;
        this.workflowMapper = workflowMapper;
        this.workflowSortStrategy = workflowSortStrategy;
    }

    public List<WorkflowResponseV2> discoverWorkflows(String category, String tags, String search,
                                                      String sortBy, int limit, int offset) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        int fetchSize = offset + safeLimit;
        var pageable = PageRequest.of(0, fetchSize, workflowSortStrategy.getSort(sortBy));
        List<Workflow> workflows = workflowRepository.findPublicOrTemplateWorkflows(pageable);
        List<String> tagList = parseTagList(tags);
        return workflows.stream()
                .filter(w -> category == null || category.equals(w.getCategory()))
                .filter(w -> tagList == null || tagList.isEmpty() || matchesAllTags(w.getTags(), tagList))
                .filter(w -> search == null || search.isBlank() ||
                        (w.getName() != null && w.getName().toLowerCase().contains(search.toLowerCase())) ||
                        (w.getDescription() != null && w.getDescription().toLowerCase().contains(search.toLowerCase())))
                .skip(offset)
                .limit(safeLimit)
                .map(this::toV2)
                .collect(Collectors.toList());
    }

    public List<WorkflowResponseV2> getTrending(int limit) {
        var pageable = PageRequest.of(0, 100);
        List<Workflow> workflows = workflowRepository.findPublicOrTemplateWorkflows(pageable);
        return workflows.stream()
                .sorted((a, b) -> Integer.compare(
                        (b.getUsesCount() != null ? b.getUsesCount() : 0) + (b.getLikesCount() != null ? b.getLikesCount() : 0) * 2,
                        (a.getUsesCount() != null ? a.getUsesCount() : 0) + (a.getLikesCount() != null ? a.getLikesCount() : 0) * 2))
                .limit(limit)
                .map(this::toV2)
                .collect(Collectors.toList());
    }

    public List<WorkflowResponseV2> getMyLikes(String userId) {
        List<String> ids = workflowLikeRepository.findByUserId(userId).stream()
                .map(WorkflowLike::getWorkflowId)
                .collect(Collectors.toList());
        if (ids.isEmpty()) return List.of();
        return workflowRepository.findByIdIn(ids).stream().map(this::toV2).collect(Collectors.toList());
    }

    private List<String> parseTagList(String tags) {
        if (tags == null || tags.isBlank()) return List.of();
        return java.util.Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    private boolean matchesAllTags(List<String> workflowTags, List<String> requiredTags) {
        if (workflowTags == null || workflowTags.isEmpty()) return requiredTags.isEmpty();
        return requiredTags.stream().allMatch(tag -> workflowTags.stream()
                .anyMatch(t -> t != null && t.equalsIgnoreCase(tag)));
    }

    private WorkflowResponseV2 toV2(Workflow w) {
        return workflowMapper.toWorkflowResponseV2(w);
    }
}
