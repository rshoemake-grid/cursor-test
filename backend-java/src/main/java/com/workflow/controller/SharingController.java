package com.workflow.controller;

import com.workflow.dto.WorkflowShareCreate;
import jakarta.validation.Valid;
import com.workflow.dto.WorkflowShareResponse;
import com.workflow.dto.WorkflowVersionCreate;
import com.workflow.dto.WorkflowVersionResponse;
import com.workflow.service.WorkflowShareService;
import com.workflow.service.WorkflowVersionService;
import com.workflow.util.AuthenticationHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Sharing Controller - matches Python sharing_routes.py
 */
@RestController
@RequestMapping("/api/sharing")
@Tag(name = "Sharing", description = "Workflow sharing and versioning")
public class SharingController {
    private final WorkflowShareService workflowShareService;
    private final WorkflowVersionService workflowVersionService;
    private final AuthenticationHelper authenticationHelper;

    public SharingController(WorkflowShareService workflowShareService,
                             WorkflowVersionService workflowVersionService,
                             AuthenticationHelper authenticationHelper) {
        this.workflowShareService = workflowShareService;
        this.workflowVersionService = workflowVersionService;
        this.authenticationHelper = authenticationHelper;
    }

    @PostMapping("/share")
    @Operation(summary = "Share Workflow")
    public ResponseEntity<WorkflowShareResponse> share(@Valid @RequestBody WorkflowShareCreate create, Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        return ResponseEntity.status(201).body(workflowShareService.shareWorkflow(create, userId));
    }

    @GetMapping("/shared-with-me")
    @Operation(summary = "Workflows Shared With Me")
    public ResponseEntity<List<WorkflowShareResponse>> sharedWithMe(Authentication authentication) {
        return ResponseEntity.ok(workflowShareService.getSharedWithMe(authenticationHelper.extractUserIdRequired(authentication)));
    }

    @GetMapping("/shared-by-me")
    @Operation(summary = "Workflows I Shared")
    public ResponseEntity<List<WorkflowShareResponse>> sharedByMe(Authentication authentication) {
        return ResponseEntity.ok(workflowShareService.getSharedByMe(authenticationHelper.extractUserIdRequired(authentication)));
    }

    @DeleteMapping("/share/{shareId}")
    @Operation(summary = "Revoke Share")
    public ResponseEntity<Void> revokeShare(@PathVariable String shareId, Authentication authentication) {
        workflowShareService.revokeShare(shareId, authenticationHelper.extractUserIdRequired(authentication));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/versions")
    @Operation(summary = "Create Version")
    public ResponseEntity<WorkflowVersionResponse> createVersion(@Valid @RequestBody WorkflowVersionCreate create, Authentication authentication) {
        return ResponseEntity.status(201).body(workflowVersionService.createVersion(create, authenticationHelper.extractUserIdRequired(authentication)));
    }

    @GetMapping("/versions/{workflowId}")
    @Operation(summary = "List Versions")
    public ResponseEntity<List<WorkflowVersionResponse>> listVersions(@PathVariable String workflowId, Authentication authentication) {
        return ResponseEntity.ok(workflowVersionService.getVersions(workflowId, authenticationHelper.extractUserIdRequired(authentication)));
    }

    @PostMapping("/versions/{versionId}/restore")
    @Operation(summary = "Restore Version")
    public ResponseEntity<Map<String, String>> restoreVersion(@PathVariable String versionId, Authentication authentication) {
        return ResponseEntity.ok(workflowVersionService.restoreVersion(versionId, authenticationHelper.extractUserIdRequired(authentication)));
    }
}
