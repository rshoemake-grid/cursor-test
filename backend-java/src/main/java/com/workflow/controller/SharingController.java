package com.workflow.controller;

import com.workflow.dto.WorkflowShareCreate;
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
    public ResponseEntity<WorkflowShareResponse> share(@RequestBody WorkflowShareCreate create, Authentication auth) {
        String userId = authenticationHelper.extractUserId(auth);
        return ResponseEntity.status(201).body(workflowShareService.shareWorkflow(create, userId));
    }

    @GetMapping("/shared-with-me")
    @Operation(summary = "Workflows Shared With Me")
    public ResponseEntity<List<WorkflowShareResponse>> sharedWithMe(Authentication auth) {
        return ResponseEntity.ok(workflowShareService.getSharedWithMe(authenticationHelper.extractUserId(auth)));
    }

    @GetMapping("/shared-by-me")
    @Operation(summary = "Workflows I Shared")
    public ResponseEntity<List<WorkflowShareResponse>> sharedByMe(Authentication auth) {
        return ResponseEntity.ok(workflowShareService.getSharedByMe(authenticationHelper.extractUserId(auth)));
    }

    @DeleteMapping("/share/{shareId}")
    @Operation(summary = "Revoke Share")
    public ResponseEntity<Void> revokeShare(@PathVariable String shareId, Authentication auth) {
        workflowShareService.revokeShare(shareId, authenticationHelper.extractUserId(auth));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/versions")
    @Operation(summary = "Create Version")
    public ResponseEntity<WorkflowVersionResponse> createVersion(@RequestBody WorkflowVersionCreate create, Authentication auth) {
        return ResponseEntity.status(201).body(workflowVersionService.createVersion(create, authenticationHelper.extractUserId(auth)));
    }

    @GetMapping("/versions/{workflowId}")
    @Operation(summary = "List Versions")
    public ResponseEntity<List<WorkflowVersionResponse>> listVersions(@PathVariable String workflowId, Authentication auth) {
        return ResponseEntity.ok(workflowVersionService.getVersions(workflowId, authenticationHelper.extractUserId(auth)));
    }

    @PostMapping("/versions/{versionId}/restore")
    @Operation(summary = "Restore Version")
    public ResponseEntity<Map<String, String>> restoreVersion(@PathVariable String versionId, Authentication auth) {
        return ResponseEntity.ok(workflowVersionService.restoreVersion(versionId, authenticationHelper.extractUserId(auth)));
    }
}
