package com.workflow.controller;

import com.workflow.dto.WorkflowResponseV2;
import com.workflow.service.ImportExportService;
import com.workflow.util.AuthenticationHelper;
import com.workflow.util.ContentDispositionUtils;
import com.workflow.util.ErrorMessages;
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
    public ResponseEntity<Map<String, Object>> exportWorkflow(@PathVariable String workflowId, Authentication authentication) {
        String userId = authenticationHelper.extractUserIdNullable(authentication);
        String exportedByUsername = authenticationHelper.extractUsernameNullable(authentication);
        var result = importExportService.exportWorkflowOptionalUser(workflowId, userId, exportedByUsername);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDispositionUtils.attachmentFilename(result.filename()))
                .contentType(MediaType.APPLICATION_JSON)
                .body(result.data());
    }

    @PostMapping("/import")
    @Operation(summary = "Import Workflow from JSON")
    public ResponseEntity<WorkflowResponseV2> importWorkflow(@RequestBody Map<String, Object> body, Authentication authentication) {
        String userId = authenticationHelper.extractUserIdNullable(authentication);
        WorkflowResponseV2 result = importExportService.importWorkflow(body, userId);
        return ResponseEntity.status(201).body(result);
    }

    @PostMapping(value = "/import/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import Workflow from File")
    public ResponseEntity<WorkflowResponseV2> importFile(@RequestParam("file") MultipartFile file, Authentication authentication) throws Exception {
        String userId = authenticationHelper.extractUserIdNullable(authentication);
        WorkflowResponseV2 result = importExportService.importFromFile(file, userId);
        return ResponseEntity.status(201).body(result);
    }

    @GetMapping("/export-all")
    @Operation(summary = "Export All Workflows")
    public ResponseEntity<Map<String, Object>> exportAll(Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        String exportedBy = authenticationHelper.exportedByOrDefault(authentication, userId);
        Map<String, Object> result = importExportService.exportAll(userId, exportedBy);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDispositionUtils.attachmentFilename(ErrorMessages.EXPORT_ALL_FILENAME))
                .contentType(MediaType.APPLICATION_JSON)
                .body(result);
    }
}
