package com.workflow.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.dto.WorkflowResponseV2;
import com.workflow.entity.Workflow;
import com.workflow.repository.WorkflowRepository;
import com.workflow.exception.ValidationException;
import com.workflow.util.ErrorMessages;
import com.workflow.util.ImportParser;
import com.workflow.util.ImportValidator;
import com.workflow.util.JsonStateUtils;
import com.workflow.util.ObjectUtils;
import com.workflow.util.RepositoryUtils;
import com.workflow.constants.WorkflowConstants;
import com.workflow.util.WorkflowDefinitionValidator;
import com.workflow.util.WorkflowFactory;
import com.workflow.util.WorkflowExportMapper;
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
    private static final int MAX_FILENAME_LENGTH = 64;

    private final WorkflowRepository workflowRepository;
    private final WorkflowMapper workflowMapper;
    private final WorkflowOwnershipService ownershipService;
    private final ObjectMapper objectMapper;

    public ImportExportService(WorkflowRepository workflowRepository, WorkflowMapper workflowMapper,
                               WorkflowOwnershipService ownershipService, ObjectMapper objectMapper) {
        this.workflowRepository = workflowRepository;
        this.workflowMapper = workflowMapper;
        this.ownershipService = ownershipService;
        this.objectMapper = objectMapper;
    }

    /**
     * Export workflow with ownership check. Use from controller to avoid controller depending on WorkflowRepository.
     */
    public ExportResult exportWorkflowWithAuth(String workflowId, String userId, String exportedBy) {
        Workflow w = RepositoryUtils.findByIdOrThrow(workflowRepository, workflowId, ErrorMessages.workflowNotFound(workflowId));
        ownershipService.assertCanRead(w, userId);
        Map<String, Object> export = exportWorkflow(w, exportedBy);
        String filename = getExportFilename(workflowId, w.getName());
        return new ExportResult(export, filename);
    }

    /**
     * Export when caller may be anonymous (Python: get_optional_user) — only public workflows for null userId.
     */
    public ExportResult exportWorkflowOptionalUser(String workflowId, String userId, String exportedByUsername) {
        Workflow w = RepositoryUtils.findByIdOrThrow(workflowRepository, workflowId, ErrorMessages.workflowNotFound(workflowId));
        ownershipService.assertCanRead(w, userId);
        String exportedBy = exportedByUsername != null && !exportedByUsername.isBlank() ? exportedByUsername : null;
        Map<String, Object> export = exportWorkflow(w, exportedBy);
        String filename = getExportFilename(workflowId, w.getName());
        return new ExportResult(export, filename);
    }

    public record ExportResult(Map<String, Object> data, String filename) {}

    public Map<String, Object> exportWorkflow(String workflowId, String exportedBy) {
        Workflow w = RepositoryUtils.findByIdOrThrow(workflowRepository, workflowId, ErrorMessages.workflowNotFound(workflowId));
        return exportWorkflow(w, exportedBy);
    }

    private Map<String, Object> exportWorkflow(Workflow w, String exportedBy) {
        Map<String, Object> workflowData = WorkflowExportMapper.toFullExportMap(w, workflowMapper);
        Map<String, Object> export = new HashMap<>();
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
        ImportValidator.validateBody(body);
        ImportParser.ImportData importData = ImportParser.parseFromBody(body);
        WorkflowDefinitionValidator.validate(importData.definition());
        Workflow w = createWorkflowFromImportData(importData, userId);
        w = workflowRepository.save(w);
        return workflowMapper.toWorkflowResponseV2(w);
    }

    public WorkflowResponseV2 importFromFile(MultipartFile file, String userId) throws Exception {
        Map<String, Object> data = ImportParser.parseFileContent(file, objectMapper);
        if (data == null || data.isEmpty()) {
            throw new ValidationException(ErrorMessages.IMPORT_FILE_EMPTY);
        }
        ImportParser.ImportData importData = ImportParser.parseFromFile(data);
        WorkflowDefinitionValidator.validate(importData.definition());
        Workflow w = createWorkflowFromImportData(importData, userId);
        w = workflowRepository.save(w);
        return workflowMapper.toWorkflowResponseV2(w);
    }

    private Workflow createWorkflowFromImportData(ImportParser.ImportData importData, String userId) {
        Workflow w = createWorkflowFromDefinition(
                importData.name(),
                importData.description(),
                importData.definition(),
                userId);
        if (importData.category() != null) w.setCategory(importData.category());
        if (importData.tags() != null && !importData.tags().isEmpty()) w.setTags(importData.tags());
        return w;
    }

    public Map<String, Object> exportAll(String userId, String exportedBy) {
        List<Workflow> workflows = workflowRepository.findByOwnerId(userId);
        List<Map<String, Object>> exports = workflows.stream()
                .map(WorkflowExportMapper::toCompactExportMap)
                .toList();
        Map<String, Object> result = new HashMap<>();
        result.put("export_version", "1.0");
        result.put("exported_at", LocalDateTime.now());
        result.put("exported_by", exportedBy);
        result.put("workflows", exports);
        return result;
    }

    private static String sanitizeFilename(String name, String workflowId) {
        if (name == null || name.isBlank()) {
            return ObjectUtils.orDefault(workflowId, "workflow");
        }
        String safe = name.replaceAll(SAFE_FILENAME_PATTERN, "_");
        return safe.length() > MAX_FILENAME_LENGTH ? safe.substring(0, MAX_FILENAME_LENGTH) : safe;
    }

    private Workflow createWorkflowFromDefinition(String name, String description, Map<String, Object> definition, String userId) {
        Map<String, Object> def = ObjectUtils.orEmptyMap(definition);
        return WorkflowFactory.create(userId, name, description, definition, WorkflowConstants.DEFAULT_VERSION,
                JsonStateUtils.getString(def, "category"),
                JsonStateUtils.getStringList(def, "tags"));
    }
}
