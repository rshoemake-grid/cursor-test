package com.workflow.util;

import com.workflow.entity.Workflow;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DRY: Centralizes Workflow entity creation used by WorkflowService, ImportExportService, TemplateService.
 */
public final class WorkflowFactory {

    private static final String DEFAULT_VERSION = "1.0.0";

    private WorkflowFactory() {
    }

    /**
     * Create a new workflow with common defaults (isPublic=false, isTemplate=false).
     */
    public static Workflow create(String ownerId, String name, String description, Map<String, Object> definition,
                                 String version, String category, List<String> tags) {
        Workflow w = new Workflow();
        w.setId(UUID.randomUUID().toString());
        w.setName(name != null && !name.isBlank() ? name : "Imported Workflow " + w.getId().substring(0, 8));
        w.setDescription(description);
        w.setVersion(version != null ? version : DEFAULT_VERSION);
        w.setDefinition(definition != null ? definition : Map.of());
        w.setOwnerId(ownerId);
        w.setIsPublic(false);
        w.setIsTemplate(false);
        w.setCategory(category);
        w.setTags(tags);
        return w;
    }
}
