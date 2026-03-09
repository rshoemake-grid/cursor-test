package com.workflow.util;

import com.workflow.entity.Workflow;

import java.util.HashMap;
import java.util.Map;

/**
 * DRY: Centralizes workflow export map construction used by ImportExportService and ExecutionExportService.
 */
public final class WorkflowExportMapper {

    private WorkflowExportMapper() {
    }

    /**
     * Build minimal export map (id, name, definition). Handles null workflow.
     */
    public static Map<String, Object> toMinimalExportMap(Workflow w) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", ObjectUtils.safeGet(w, Workflow::getId));
        m.put("name", ObjectUtils.safeGet(w, Workflow::getName));
        m.put("definition", ObjectUtils.safeGet(w, Workflow::getDefinition));
        return m;
    }

    /**
     * Build full export map with expanded nodes/edges/variables. Requires WorkflowMapper for extraction.
     */
    public static Map<String, Object> toFullExportMap(Workflow w, WorkflowMapper workflowMapper) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", w.getId());
        m.put("name", w.getName());
        m.put("description", w.getDescription());
        m.put("version", w.getVersion());
        m.put("created_at", w.getCreatedAt());
        m.put("updated_at", w.getUpdatedAt());
        Map<String, Object> definition = ObjectUtils.orEmptyMap(w.getDefinition());
        m.put("nodes", workflowMapper.extractNodes(definition));
        m.put("edges", workflowMapper.extractEdges(definition));
        m.put("variables", workflowMapper.extractVariables(definition));
        m.put("owner_id", w.getOwnerId());
        m.put("is_public", w.getIsPublic());
        m.put("is_template", w.getIsTemplate());
        m.put("category", w.getCategory());
        m.put("tags", w.getTags());
        m.put("likes_count", w.getLikesCount());
        m.put("views_count", w.getViewsCount());
        m.put("uses_count", w.getUsesCount());
        return m;
    }

    /**
     * Build compact export map with raw definition (no node/edge expansion).
     */
    public static Map<String, Object> toCompactExportMap(Workflow w) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", w.getId());
        m.put("name", w.getName());
        m.put("description", w.getDescription());
        m.put("version", w.getVersion());
        m.put("created_at", w.getCreatedAt());
        m.put("updated_at", w.getUpdatedAt());
        m.put("definition", w.getDefinition());
        return m;
    }
}
