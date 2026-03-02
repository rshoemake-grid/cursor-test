package com.workflow.service;

import com.workflow.dto.PublishedAgentCreateRequest;
import com.workflow.dto.PublishedAgentResponse;
import com.workflow.dto.WorkflowResponseV2;
import com.workflow.entity.PublishedAgent;
import com.workflow.entity.User;
import com.workflow.entity.Workflow;
import com.workflow.entity.WorkflowLike;
import com.workflow.entity.WorkflowTemplate;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.repository.PublishedAgentRepository;
import com.workflow.repository.UserRepository;
import com.workflow.repository.WorkflowLikeRepository;
import com.workflow.repository.WorkflowRepository;
import com.workflow.repository.WorkflowTemplateRepository;
import com.workflow.util.WorkflowMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Marketplace service - matches Python marketplace_routes
 */
@Service
@Transactional
public class MarketplaceService {
    private final WorkflowRepository workflowRepository;
    private final WorkflowLikeRepository workflowLikeRepository;
    private final WorkflowTemplateRepository templateRepository;
    private final UserRepository userRepository;
    private final PublishedAgentRepository publishedAgentRepository;
    private final WorkflowMapper workflowMapper;

    public MarketplaceService(WorkflowRepository workflowRepository,
                              WorkflowLikeRepository workflowLikeRepository,
                              WorkflowTemplateRepository templateRepository,
                              UserRepository userRepository,
                              PublishedAgentRepository publishedAgentRepository,
                              WorkflowMapper workflowMapper) {
        this.workflowRepository = workflowRepository;
        this.workflowLikeRepository = workflowLikeRepository;
        this.templateRepository = templateRepository;
        this.userRepository = userRepository;
        this.publishedAgentRepository = publishedAgentRepository;
        this.workflowMapper = workflowMapper;
    }

    public List<WorkflowResponseV2> discoverWorkflows(String category, String tags, String search,
                                                      String sortBy, int limit, int offset) {
        var pageable = PageRequest.of(offset / limit, limit, sortBySort(sortBy));
        List<Workflow> workflows = workflowRepository.findPublicOrTemplateWorkflows(pageable);
        return workflows.stream()
                .filter(w -> category == null || category.equals(w.getCategory()))
                .filter(w -> search == null || search.isBlank() ||
                        (w.getName() != null && w.getName().toLowerCase().contains(search.toLowerCase())) ||
                        (w.getDescription() != null && w.getDescription().toLowerCase().contains(search.toLowerCase())))
                .map(this::toV2)
                .collect(Collectors.toList());
    }

    private Sort sortBySort(String sortBy) {
        return switch (sortBy != null ? sortBy : "popular") {
            case "recent" -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "likes" -> Sort.by(Sort.Direction.DESC, "likesCount");
            default -> Sort.by(Sort.Direction.DESC, "usesCount");
        };
    }

    @Transactional
    public Map<String, String> likeWorkflow(String workflowId, String userId) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));
        if (workflowLikeRepository.findByWorkflowIdAndUserId(workflowId, userId).isPresent()) {
            return Map.of("message", "Already liked");
        }
        WorkflowLike like = new WorkflowLike();
        like.setId(UUID.randomUUID().toString());
        like.setWorkflowId(workflowId);
        like.setUserId(userId);
        workflowLikeRepository.save(like);
        workflow.setLikesCount((workflow.getLikesCount() != null ? workflow.getLikesCount() : 0) + 1);
        workflowRepository.save(workflow);
        return Map.of("message", "Liked successfully");
    }

    @Transactional
    public void unlikeWorkflow(String workflowId, String userId) {
        workflowLikeRepository.findByWorkflowIdAndUserId(workflowId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Like not found"));
        workflowLikeRepository.deleteByWorkflowIdAndUserId(workflowId, userId);
        workflowRepository.findById(workflowId).ifPresent(w -> {
            w.setLikesCount(Math.max(0, (w.getLikesCount() != null ? w.getLikesCount() : 0) - 1));
            workflowRepository.save(w);
        });
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

    public List<WorkflowResponseV2> getMyLikes(String userId) {
        List<String> ids = workflowLikeRepository.findByUserId(userId).stream()
                .map(WorkflowLike::getWorkflowId)
                .collect(Collectors.toList());
        if (ids.isEmpty()) return List.of();
        return workflowRepository.findByIdIn(ids).stream().map(this::toV2).collect(Collectors.toList());
    }

    private WorkflowResponseV2 toV2(Workflow w) {
        var def = w.getDefinition() != null ? w.getDefinition() : Map.<String, Object>of();
        return new WorkflowResponseV2(
                w.getId(), w.getName(), w.getDescription(), w.getVersion(),
                workflowMapper.extractNodes(def), workflowMapper.extractEdges(def),
                workflowMapper.extractVariables(def), w.getOwnerId(), w.getIsPublic(), w.getIsTemplate(),
                w.getCategory(), w.getTags(), w.getLikesCount(), w.getViewsCount(), w.getUsesCount(),
                w.getCreatedAt(), w.getUpdatedAt());
    }

    public PublishedAgentResponse publishAgent(PublishedAgentCreateRequest request, String userId, boolean isAdmin) {
        PublishedAgent agent = new PublishedAgent();
        agent.setId(UUID.randomUUID().toString());
        agent.setName(request.getName());
        agent.setDescription(request.getDescription());
        agent.setCategory(request.getCategory());
        agent.setTags(request.getTags() != null ? request.getTags() : List.of());
        agent.setDifficulty(request.getDifficulty() != null ? request.getDifficulty() : "beginner");
        agent.setEstimatedTime(request.getEstimatedTime());
        agent.setAgentConfig(request.getAgentConfig() != null ? request.getAgentConfig() : Map.of());
        agent.setAuthorId(userId);
        agent.setIsOfficial(isAdmin);
        publishedAgentRepository.save(agent);

        String authorName = userRepository.findById(userId)
                .map(u -> u.getUsername() != null ? u.getUsername() : u.getFullName() != null ? u.getFullName() : u.getEmail())
                .orElse(null);

        return PublishedAgentResponse.builder()
                .id(agent.getId())
                .name(agent.getName())
                .description(agent.getDescription())
                .category(agent.getCategory())
                .tags(agent.getTags())
                .difficulty(agent.getDifficulty())
                .estimatedTime(agent.getEstimatedTime())
                .agentConfig(agent.getAgentConfig())
                .publishedAt(agent.getCreatedAt())
                .authorId(agent.getAuthorId())
                .authorName(authorName)
                .isOfficial(agent.getIsOfficial())
                .build();
    }

    public List<PublishedAgentResponse> listAgents(String category, String search, int limit, int offset) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        int page = offset / safeLimit;
        Pageable pageable = PageRequest.of(page, safeLimit, Sort.by(Sort.Direction.DESC, "createdAt"));
        return publishedAgentRepository.findByFilters(category, search, pageable).stream()
                .map(this::toAgentResponse)
                .collect(Collectors.toList());
    }

    private PublishedAgentResponse toAgentResponse(PublishedAgent a) {
        String authorName = a.getAuthorId() != null
                ? userRepository.findById(a.getAuthorId())
                        .map(u -> u.getUsername() != null ? u.getUsername() : u.getFullName() != null ? u.getFullName() : u.getEmail())
                        .orElse(null)
                : null;
        return PublishedAgentResponse.builder()
                .id(a.getId())
                .name(a.getName())
                .description(a.getDescription())
                .category(a.getCategory())
                .tags(a.getTags() != null ? a.getTags() : List.of())
                .difficulty(a.getDifficulty())
                .estimatedTime(a.getEstimatedTime())
                .agentConfig(a.getAgentConfig())
                .publishedAt(a.getCreatedAt())
                .authorId(a.getAuthorId())
                .authorName(authorName)
                .isOfficial(a.getIsOfficial() != null ? a.getIsOfficial() : false)
                .build();
    }
}
