package com.workflow.controller;

import com.workflow.dto.PublishedAgentCreateRequest;
import com.workflow.dto.PublishedAgentResponse;
import com.workflow.dto.WorkflowLikeRequest;
import com.workflow.dto.WorkflowResponseV2;
import com.workflow.service.MarketplaceService;
import com.workflow.util.AuthenticationHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Marketplace Controller - matches Python marketplace_routes.py
 */
@RestController
@RequestMapping("/api/marketplace")
@Tag(name = "Marketplace", description = "Workflow discovery, likes, and published agents")
public class MarketplaceController {
    private final MarketplaceService marketplaceService;
    private final AuthenticationHelper authenticationHelper;

    public MarketplaceController(MarketplaceService marketplaceService, AuthenticationHelper authenticationHelper) {
        this.marketplaceService = marketplaceService;
        this.authenticationHelper = authenticationHelper;
    }

    @GetMapping("/discover")
    @Operation(summary = "Discover Workflows")
    public ResponseEntity<List<WorkflowResponseV2>> discover(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "popular") String sortBy,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        return ResponseEntity.ok(marketplaceService.discoverWorkflows(category, tags, search, sortBy, limit, offset));
    }

    @PostMapping("/like")
    @Operation(summary = "Like Workflow")
    public ResponseEntity<Map<String, String>> like(@RequestBody WorkflowLikeRequest request, Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        return ResponseEntity.status(201).body(marketplaceService.likeWorkflow(request.getWorkflowId(), userId));
    }

    @DeleteMapping("/like/{workflowId}")
    @Operation(summary = "Unlike Workflow")
    public ResponseEntity<Void> unlike(@PathVariable String workflowId, Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        marketplaceService.unlikeWorkflow(workflowId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/trending")
    @Operation(summary = "Trending Workflows")
    public ResponseEntity<List<WorkflowResponseV2>> trending(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(marketplaceService.getTrending(limit));
    }

    @GetMapping("/stats")
    @Operation(summary = "Marketplace Stats")
    public ResponseEntity<Map<String, Object>> stats() {
        return ResponseEntity.ok(marketplaceService.getStats());
    }

    @GetMapping("/my-likes")
    @Operation(summary = "My Liked Workflows")
    public ResponseEntity<List<WorkflowResponseV2>> myLikes(Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        return ResponseEntity.ok(marketplaceService.getMyLikes(userId));
    }

    @PostMapping("/agents")
    @Operation(summary = "Publish Agent")
    public ResponseEntity<PublishedAgentResponse> publishAgent(
            @Valid @RequestBody PublishedAgentCreateRequest request,
            Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        boolean isAdmin = authenticationHelper.extractIsAdmin(authentication);
        return ResponseEntity.status(201).body(marketplaceService.publishAgent(request, userId, isAdmin));
    }

    @GetMapping("/agents")
    @Operation(summary = "List Agents")
    public ResponseEntity<List<PublishedAgentResponse>> listAgents(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        return ResponseEntity.ok(marketplaceService.listAgents(category, search, limit, offset));
    }
}
