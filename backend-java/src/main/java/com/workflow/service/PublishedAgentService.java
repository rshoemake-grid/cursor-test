package com.workflow.service;

import com.workflow.dto.PublishedAgentCreateRequest;
import com.workflow.dto.PublishedAgentResponse;
import com.workflow.entity.PublishedAgent;
import com.workflow.entity.User;
import com.workflow.repository.PublishedAgentRepository;
import com.workflow.repository.UserRepository;
import com.workflow.util.UserDisplayNameResolver;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * SRP-4: Published agent CRUD extracted from MarketplaceService.
 */
@Service
public class PublishedAgentService {
    private final PublishedAgentRepository publishedAgentRepository;
    private final UserRepository userRepository;

    public PublishedAgentService(PublishedAgentRepository publishedAgentRepository,
                                UserRepository userRepository) {
        this.publishedAgentRepository = publishedAgentRepository;
        this.userRepository = userRepository;
    }

    @Transactional
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
                .map(UserDisplayNameResolver::resolve)
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
        int fetchSize = offset + safeLimit;
        Pageable pageable = PageRequest.of(0, fetchSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        return publishedAgentRepository.findByFilters(category, search, pageable).stream()
                .skip(offset)
                .limit(safeLimit)
                .map(this::toAgentResponse)
                .toList();
    }

    private PublishedAgentResponse toAgentResponse(PublishedAgent a) {
        String authorName = a.getAuthorId() != null
                ? userRepository.findById(a.getAuthorId()).map(UserDisplayNameResolver::resolve).orElse(null)
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
