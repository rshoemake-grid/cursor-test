package com.workflow.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.dto.WorkflowResponseV2;
import com.workflow.entity.Workflow;
import com.workflow.repository.WorkflowRepository;
import com.workflow.exception.ValidationException;
import com.workflow.util.RepositoryUtils;
import com.workflow.util.WorkflowDefinitionValidator;
import com.workflow.util.WorkflowMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

/**
 * SRP-2: Import/export business logic extracted from ImportExportController.
 */
@Service
public class ImportExportService {
    private static final String SAFE_FILENAME_PATTERN = "[^a-zA-Z0-9._-]";
    private static final int MAX_IMPORT_DEFINITION_KEYS = 50;

    private final WorkflowRepository workflowRepository;
    private final WorkflowMapper workflowMapper;
    private final ObjectMapper objectMapper;

    public ImportExportService(WorkflowRepository workflowRepository, WorkflowMapper workflowMapper,
                               ObjectMapper objectMapper) {
        this.workflowRepository = workflowRepository;
        this.workflowMapper = workflowMapper;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> exportWorkflow(String workflowId, String exportedBy) {
        Workflow w = RepositoryUtils.findByIdOrThrow(workflowRepository, workflowId, "Workflow not found");
        Map<String, Object> export = new HashMap<>();
        Map<String, Object> workflowData = new HashMap<>();
        workflowData.put("id", w.getId());
        workflowData.put("name", w.getName());
        workflowData.put("description", w.getDescription());
        workflowData.put("version", w.getVersion());
        Map<String, Object> definition = w.getDefinition();
        workflowData.put("nodes", definition != null ? workflowMapper.extractNodes(definition) : List.of());
        workflowData.put("edges", definition != null ? workflowMapper.extractEdges(definition) : List.of());
        workflowData.put("variables", definition != null ? workflowMapper.extractVariables(definition) : Map.of());
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
        export.put("exported_by", exportedBy);
        return export;
    }

    public String getExportFilename(String workflowId, String workflowName) {
        String safe = sanitizeFilename(workflowName, workflowId);
        return "workflow-" + safe + ".json";
    }

    public WorkflowResponseV2 importWorkflow(Map<String, Object> body, String userId) {
        validateImportBody(body);
        @SuppressWarnings("unchecked")
        Map<String, Object> definition = (Map<String, Object>) body.get("definition");
        WorkflowDefinitionValidator.validate(definition);
        Workflow w = createWorkflowFromDefinition(
                (String) body.get("name"),
                (String) body.get("description"),
                definition,
                userId);
        w = workflowRepository.save(w);
        return workflowMapper.toWorkflowResponseV2(w);
    }

    public WorkflowResponseV2 importFromFile(MultipartFile file, String userId) throws Exception {
        String content = new String(file.getBytes());
        Map<String, Object> data;
        try {
            data = objectMapper.readValue(content, Map.class);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new ValidationException("Invalid JSON: " + e.getMessage());
        }
        if (data == null || data.isEmpty()) {
            throw new ValidationException("Import file is empty or invalid");
        }
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
        WorkflowDefinitionValidator.validate(definition);
        Workflow w = createWorkflowFromDefinition(name, description, definition, userId);
        if (category != null) w.setCategory(category);
        if (tags != null) w.setTags(tags);
        w = workflowRepository.save(w);
        return workflowMapper.toWorkflowResponseV2(w);
    }

    public Map<String, Object> exportAll(String userId, String exportedBy) {
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
        result.put("exported_by", exportedBy);
        result.put("workflows", exports);
        return result;
    }

    private void validateImportBody(Map<String, Object> body) {
        if (body == null || body.isEmpty()) {
            throw new ValidationException("Import body must not be empty");
        }
        if (!body.containsKey("definition")) {
            throw new ValidationException("Import body must contain 'definition'");
        }
        Object def = body.get("definition");
        if (!(def instanceof Map)) {
            throw new ValidationException("Import 'definition' must be an object");
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> definition = (Map<String, Object>) def;
        if (definition.size() > MAX_IMPORT_DEFINITION_KEYS) {
            throw new ValidationException("Import definition exceeds maximum size");
        }
    }

    private static String sanitizeFilename(String name, String workflowId) {
        if (name == null || name.isBlank()) {
            return workflowId != null ? workflowId : "workflow";
        }
        String safe = name.replaceAll(SAFE_FILENAME_PATTERN, "_");
        return safe.length() > 64 ? safe.substring(0, 64) : safe;
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
}
