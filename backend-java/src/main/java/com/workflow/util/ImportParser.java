package com.workflow.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.exception.ValidationException;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * SRP: Parses import data from JSON body or file.
 * Extracted from ImportExportService.
 */
public final class ImportParser {

    private ImportParser() {
    }

    public record ImportData(String name, String description, Map<String, Object> definition,
                            String category, java.util.List<String> tags) {
    }

    /**
     * Parse raw JSON file content to map.
     */
    public static Map<String, Object> parseFileContent(MultipartFile file, ObjectMapper objectMapper) throws java.io.IOException {
        String content = new String(file.getBytes());
        try {
            return objectMapper.readValue(content, Map.class);
        } catch (JsonProcessingException e) {
            throw new ValidationException(ErrorMessages.IMPORT_FILE_INVALID_JSON + ": " + e.getMessage());
        }
    }

    /**
     * Parse import data from request body (definition-only format).
     */
    public static ImportData parseFromBody(Map<String, Object> body) {
        Map<String, Object> definition = JsonStateUtils.getMap(body, "definition");
        return new ImportData(
                JsonStateUtils.getString(body, "name"),
                JsonStateUtils.getString(body, "description"),
                definition,
                null,
                null);
    }

    /**
     * Parse import data from file content (workflow wrapper or raw definition).
     */
    public static ImportData parseFromFile(Map<String, Object> data) {
        if (data.containsKey("workflow")) {
            Map<String, Object> wf = JsonStateUtils.getMap(data, "workflow");
            Map<String, Object> definition = Map.of(
                    "nodes", JsonStateUtils.getList(wf, "nodes"),
                    "edges", JsonStateUtils.getList(wf, "edges"),
                    "variables", JsonStateUtils.getMap(wf, "variables"));
            return buildImportData(wf, definition);
        }
        Map<String, Object> definition = JsonStateUtils.getMap(data, "definition");
        if (definition.isEmpty()) {
            definition = data;
        }
        return buildImportData(data, definition);
    }

    private static ImportData buildImportData(Map<String, Object> source, Map<String, Object> definition) {
        return new ImportData(
                JsonStateUtils.getString(source, "name"),
                JsonStateUtils.getString(source, "description"),
                definition,
                JsonStateUtils.getString(source, "category"),
                JsonStateUtils.getStringList(source, "tags"));
    }
}
