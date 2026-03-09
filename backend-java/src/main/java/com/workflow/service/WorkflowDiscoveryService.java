package com.workflow.service;

import com.workflow.dto.WorkflowResponseV2;
import com.workflow.entity.Workflow;
import com.workflow.entity.WorkflowLike;
import com.workflow.repository.WorkflowLikeRepository;
import com.workflow.repository.WorkflowRepository;
import com.workflow.util.ObjectUtils;
import com.workflow.util.PaginationUtils;
import com.workflow.util.SearchUtils;
import com.workflow.util.SortStrategy;
import com.workflow.util.WorkflowMapper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * SRP-4: Workflow discovery and browsing extracted from MarketplaceService.
 */
@Service
public class WorkflowDiscoveryService {
    private static final int TRENDING_FETCH_SIZE = 100;
    /** Weight for likes in trending score (likes count * LIKES_WEIGHT). */
    private static final int LIKES_WEIGHT = 2;

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
        int safeLimit = PaginationUtils.clampLimit(limit);
        int fetchSize = PaginationUtils.fetchSize(offset, safeLimit);
        var pageable = PageRequest.of(0, fetchSize, workflowSortStrategy.getSort(sortBy));
        List<Workflow> workflows = workflowRepository.findPublicOrTemplateWorkflows(pageable);
        List<String> tagList = parseTagList(tags);
        return workflows.stream()
                .filter(w -> category == null || category.equals(w.getCategory()))
                .filter(w -> tagList == null || tagList.isEmpty() || matchesAllTags(w.getTags(), tagList))
                .filter(w -> SearchUtils.matchesSearch(search, w.getName(), w.getDescription()))
                .skip(offset)
                .limit(safeLimit)
                .map(this::toV2)
                .collect(Collectors.toList());
    }

    public List<WorkflowResponseV2> getTrending(int limit) {
        var pageable = PageRequest.of(0, TRENDING_FETCH_SIZE);
        List<Workflow> workflows = workflowRepository.findPublicOrTemplateWorkflows(pageable);
        return workflows.stream()
                .sorted((a, b) -> Integer.compare(trendingScore(b), trendingScore(a)))
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

    private static int trendingScore(Workflow w) {
        return ObjectUtils.orDefaultInt(w.getUsesCount(), 0)
                + ObjectUtils.orDefaultInt(w.getLikesCount(), 0) * LIKES_WEIGHT;
    }

    private WorkflowResponseV2 toV2(Workflow w) {
        return workflowMapper.toWorkflowResponseV2(w);
    }
}
