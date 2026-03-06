package com.workflow.controller;

import com.workflow.dto.WorkflowResponseV2;
import com.workflow.entity.Workflow;
import com.workflow.repository.WorkflowRepository;
import com.workflow.service.ImportExportService;
import com.workflow.service.WorkflowOwnershipService;
import com.workflow.util.AuthenticationHelper;
import com.workflow.util.RepositoryUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Import/Export Controller - matches Python import_export_routes.py
 * SRP-2: Delegates business logic to ImportExportService.
 */
@RestController
@RequestMapping("/api/import-export")
@Tag(name = "Import/Export", description = "Workflow import and export")
public class ImportExportController {
    private final WorkflowRepository workflowRepository;
    private final ImportExportService importExportService;
    private final AuthenticationHelper authenticationHelper;
    private final WorkflowOwnershipService ownershipService;

    public ImportExportController(WorkflowRepository workflowRepository, ImportExportService importExportService,
                                 AuthenticationHelper authenticationHelper, WorkflowOwnershipService ownershipService) {
        this.workflowRepository = workflowRepository;
        this.importExportService = importExportService;
        this.authenticationHelper = authenticationHelper;
        this.ownershipService = ownershipService;
    }

    @GetMapping("/export/{workflowId}")
    @Operation(summary = "Export Workflow")
    public ResponseEntity<Map<String, Object>> exportWorkflow(@PathVariable String workflowId, Authentication auth) {
        Workflow w = RepositoryUtils.findByIdOrThrow(workflowRepository, workflowId, "Workflow not found");
        String userId = authenticationHelper.extractUserIdNullable(auth);
        ownershipService.assertCanRead(w, userId);
        String exportedBy = auth != null ? authenticationHelper.extractUsername(auth) : null;
        Map<String, Object> export = importExportService.exportWorkflow(workflowId, exportedBy);
        String filename = importExportService.getExportFilename(workflowId, w.getName());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.APPLICATION_JSON)
                .body(export);
    }

    @PostMapping("/import")
    @Operation(summary = "Import Workflow from JSON")
    public ResponseEntity<WorkflowResponseV2> importWorkflow(@RequestBody Map<String, Object> body, Authentication auth) {
        String userId = authenticationHelper.extractUserIdNullable(auth);
        WorkflowResponseV2 result = importExportService.importWorkflow(body, userId);
        return ResponseEntity.status(201).body(result);
    }

    @PostMapping(value = "/import/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import Workflow from File")
    public ResponseEntity<WorkflowResponseV2> importFile(@RequestParam("file") MultipartFile file, Authentication auth) throws Exception {
        String userId = authenticationHelper.extractUserIdNullable(auth);
        WorkflowResponseV2 result = importExportService.importFromFile(file, userId);
        return ResponseEntity.status(201).body(result);
    }

    @GetMapping("/export-all")
    @Operation(summary = "Export All Workflows")
    public ResponseEntity<Map<String, Object>> exportAll(Authentication auth) {
        String userId = authenticationHelper.extractUserId(auth);
        String exportedBy = authenticationHelper.extractUsername(auth);
        Map<String, Object> result = importExportService.exportAll(userId, exportedBy);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=workflows.json")
                .contentType(MediaType.APPLICATION_JSON)
                .body(result);
    }
}
