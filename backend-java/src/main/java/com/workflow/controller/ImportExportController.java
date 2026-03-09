package com.workflow.controller;

import com.workflow.dto.WorkflowResponseV2;
import com.workflow.service.ImportExportService;
import com.workflow.util.AuthenticationHelper;
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
    private final ImportExportService importExportService;
    private final AuthenticationHelper authenticationHelper;

    public ImportExportController(ImportExportService importExportService,
                                 AuthenticationHelper authenticationHelper) {
        this.importExportService = importExportService;
        this.authenticationHelper = authenticationHelper;
    }

    @GetMapping("/export/{workflowId}")
    @Operation(summary = "Export Workflow")
    public ResponseEntity<Map<String, Object>> exportWorkflow(@PathVariable String workflowId, Authentication auth) {
        String userId = authenticationHelper.extractUserIdNullable(auth);
        String exportedBy = auth != null ? authenticationHelper.extractUsername(auth) : null;
        var result = importExportService.exportWorkflowWithAuth(workflowId, userId, exportedBy);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + result.filename())
                .contentType(MediaType.APPLICATION_JSON)
                .body(result.data());
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
