package com.workflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.dto.WorkflowResponseV2;
import com.workflow.entity.Workflow;
import com.workflow.exception.ForbiddenException;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.repository.WorkflowRepository;
import com.workflow.util.AuthenticationHelper;
import com.workflow.util.WorkflowMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.UUID;

/**
 * Import/Export Controller - matches Python import_export_routes.py
 */
@RestController
@RequestMapping("/api/v1/import-export")
@Tag(name = "Import/Export", description = "Workflow import and export")
public class ImportExportController {
    private final WorkflowRepository workflowRepository;
    private final WorkflowMapper workflowMapper;
    private final AuthenticationHelper authenticationHelper;
    private final ObjectMapper objectMapper;

    public ImportExportController(WorkflowRepository workflowRepository, WorkflowMapper workflowMapper,
                                 AuthenticationHelper authenticationHelper, ObjectMapper objectMapper) {
        this.workflowRepository = workflowRepository;
        this.workflowMapper = workflowMapper;
        this.authenticationHelper = authenticationHelper;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/export/{workflowId}")
    @Operation(summary = "Export Workflow")
    public ResponseEntity<Map<String, Object>> exportWorkflow(@PathVariable String workflowId, Authentication auth) {
        Workflow w = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));
        String userId = authenticationHelper.extractUserIdNullable(auth);
        if (!Boolean.TRUE.equals(w.getIsPublic()) && (userId == null || !w.getOwnerId().equals(userId))) {
            throw new ForbiddenException("Not authorized");
        }
        Map<String, Object> export = new HashMap<>();
        Map<String, Object> workflowData = new HashMap<>();
        workflowData.put("id", w.getId());
        workflowData.put("name", w.getName());
        workflowData.put("description", w.getDescription());
        workflowData.put("version", w.getVersion());
        workflowData.put("nodes", w.getDefinition() != null ? ((Map<?, ?>) w.getDefinition()).get("nodes") : List.of());
        workflowData.put("edges", w.getDefinition() != null ? ((Map<?, ?>) w.getDefinition()).get("edges") : List.of());
        workflowData.put("variables", w.getDefinition() != null ? ((Map<?, ?>) w.getDefinition()).get("variables") : Map.of());
        workflowData.put("owner_id", w.getOwnerId());
        workflowData.put("is_public", w.getIsPublic());
        workflowData.put("is_template", w.getIsTemplate());
        workflowData.put("category", w.getCategory());
        workflowData.put("tags", w.getTags());
        workflowData.put("likes_count", w.getLikesCount());
        workflowData.put("views_count", w.getViewsCount());
        workflowData.put("uses_count", w.getUsesCount());
        workflowData.put("created_at", w.getCreatedAt());
        workflowData.put("updated_at", w.getUpdatedAt());
        export.put("workflow", workflowData);
        export.put("version", "1.0");
        export.put("exported_at", LocalDateTime.now());
        export.put("exported_by", auth != null ? authenticationHelper.extractUser(auth).map(u -> u.getUsername()).orElse(null) : null);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=workflow-" + (w.getName() != null ? w.getName().replace(" ", "_") : workflowId) + ".json")
                .contentType(MediaType.APPLICATION_JSON)
                .body(export);
    }

    @PostMapping("/import")
    @Operation(summary = "Import Workflow from JSON")
    public ResponseEntity<WorkflowResponseV2> importWorkflow(@RequestBody Map<String, Object> body, Authentication auth) {
        @SuppressWarnings("unchecked")
        Map<String, Object> definition = (Map<String, Object>) body.get("definition");
        if (definition == null || !definition.containsKey("nodes") || !definition.containsKey("edges")) {
            throw new IllegalArgumentException("Invalid workflow definition: must contain 'nodes' and 'edges'");
        }
        String userId = authenticationHelper.extractUserIdNullable(auth);
        Workflow w = createWorkflowFromDefinition(
                (String) body.get("name"),
                (String) body.get("description"),
                definition,
                userId);
        w = workflowRepository.save(w);
        return ResponseEntity.status(201).body(toV2(w));
    }

    @PostMapping(value = "/import/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import Workflow from File")
    public ResponseEntity<WorkflowResponseV2> importFile(@RequestParam("file") MultipartFile file, Authentication auth) throws Exception {
        String content = new String(file.getBytes());
        @SuppressWarnings("unchecked")
        Map<String, Object> data = objectMapper.readValue(content, Map.class);
        String name = null;
        String description = null;
        Map<String, Object> definition;
        String category = null;
        List<String> tags = null;
        if (data.containsKey("workflow")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> wf = (Map<String, Object>) data.get("workflow");
            definition = Map.of(
                    "nodes", wf.getOrDefault("nodes", List.of()),
                    "edges", wf.getOrDefault("edges", List.of()),
                    "variables", wf.getOrDefault("variables", Map.of()));
            name = (String) wf.get("name");
            description = (String) wf.get("description");
            category = (String) wf.get("category");
            tags = (List<String>) wf.get("tags");
        } else {
            definition = data;
            name = (String) data.get("name");
            description = (String) data.get("description");
            category = (String) data.get("category");
            tags = (List<String>) data.get("tags");
        }
        if (!definition.containsKey("nodes") || !definition.containsKey("edges")) {
            throw new IllegalArgumentException("Invalid workflow: must contain 'nodes' and 'edges'");
        }
        String userId = authenticationHelper.extractUserIdNullable(auth);
        Workflow w = createWorkflowFromDefinition(name, description, definition, userId);
        if (category != null) w.setCategory(category);
        if (tags != null) w.setTags(tags);
        w = workflowRepository.save(w);
        return ResponseEntity.status(201).body(toV2(w));
    }

    @GetMapping("/export-all")
    @Operation(summary = "Export All Workflows")
    public ResponseEntity<Map<String, Object>> exportAll(Authentication auth) {
        String userId = authenticationHelper.extractUserId(auth);
        List<Workflow> workflows = workflowRepository.findByOwnerId(userId);
        List<Map<String, Object>> exports = new ArrayList<>();
        for (Workflow w : workflows) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", w.getId());
            item.put("name", w.getName());
            item.put("description", w.getDescription());
            item.put("version", w.getVersion());
            item.put("definition", w.getDefinition());
            item.put("created_at", w.getCreatedAt());
            item.put("updated_at", w.getUpdatedAt());
            exports.add(item);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("export_version", "1.0");
        result.put("exported_at", LocalDateTime.now());
        result.put("exported_by", authenticationHelper.extractUser(auth).map(u -> u.getUsername()).orElse(null));
        result.put("workflows", exports);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=workflows.json")
                .contentType(MediaType.APPLICATION_JSON)
                .body(result);
    }

    private Workflow createWorkflowFromDefinition(String name, String description, Map<String, Object> definition, String userId) {
        Workflow w = new Workflow();
        w.setId(UUID.randomUUID().toString());
        w.setName(name != null ? name : "Imported Workflow " + w.getId().substring(0, 8));
        w.setDescription(description);
        w.setVersion("1.0.0");
        w.setDefinition(definition);
        w.setOwnerId(userId);
        w.setIsPublic(false);
        w.setIsTemplate(false);
        w.setCategory((String) definition.get("category"));
        w.setTags((List<String>) definition.get("tags"));
        return w;
    }

    private WorkflowResponseV2 toV2(Workflow w) {
        return new WorkflowResponseV2(
                w.getId(), w.getName(), w.getDescription(), w.getVersion(),
                workflowMapper.extractNodes(w.getDefinition()),
                workflowMapper.extractEdges(w.getDefinition()),
                workflowMapper.extractVariables(w.getDefinition()),
                w.getOwnerId(), w.getIsPublic(), w.getIsTemplate(),
                w.getCategory(), w.getTags(), w.getLikesCount(), w.getViewsCount(), w.getUsesCount(),
                w.getCreatedAt(), w.getUpdatedAt());
    }
}
