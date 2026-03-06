package com.workflow.service;

import com.workflow.dto.PublishedAgentCreateRequest;
import com.workflow.dto.PublishedAgentResponse;
import com.workflow.dto.WorkflowResponseV2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Marketplace facade - delegates to WorkflowDiscoveryService, WorkflowLikeService,
 * PublishedAgentService, MarketplaceStatsService (SRP-4).
 */
@Service
@Transactional
public class MarketplaceService {
    private final WorkflowDiscoveryService workflowDiscoveryService;
    private final WorkflowLikeService workflowLikeService;
    private final PublishedAgentService publishedAgentService;
    private final MarketplaceStatsService marketplaceStatsService;

    public MarketplaceService(WorkflowDiscoveryService workflowDiscoveryService,
                              WorkflowLikeService workflowLikeService,
                              PublishedAgentService publishedAgentService,
                              MarketplaceStatsService marketplaceStatsService) {
        this.workflowDiscoveryService = workflowDiscoveryService;
        this.workflowLikeService = workflowLikeService;
        this.publishedAgentService = publishedAgentService;
        this.marketplaceStatsService = marketplaceStatsService;
    }

    public List<WorkflowResponseV2> discoverWorkflows(String category, String tags, String search,
                                                      String sortBy, int limit, int offset) {
        return workflowDiscoveryService.discoverWorkflows(category, tags, search, sortBy, limit, offset);
    }

    public Map<String, String> likeWorkflow(String workflowId, String userId) {
        return workflowLikeService.likeWorkflow(workflowId, userId);
    }

    public void unlikeWorkflow(String workflowId, String userId) {
        workflowLikeService.unlikeWorkflow(workflowId, userId);
    }

    public List<WorkflowResponseV2> getTrending(int limit) {
        return workflowDiscoveryService.getTrending(limit);
    }

    public Map<String, Object> getStats() {
        return marketplaceStatsService.getStats();
    }

    public List<WorkflowResponseV2> getMyLikes(String userId) {
        return workflowDiscoveryService.getMyLikes(userId);
    }

    public PublishedAgentResponse publishAgent(PublishedAgentCreateRequest request, String userId, boolean isAdmin) {
        return publishedAgentService.publishAgent(request, userId, isAdmin);
    }

    public List<PublishedAgentResponse> listAgents(String category, String search, int limit, int offset) {
        return publishedAgentService.listAgents(category, search, limit, offset);
    }
}
