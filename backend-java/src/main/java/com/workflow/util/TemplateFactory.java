package com.workflow.util;

import com.workflow.entity.Workflow;
import com.workflow.entity.WorkflowTemplate;
import com.workflow.dto.WorkflowPublishRequest;
import com.workflow.dto.WorkflowTemplateCreate;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DRY: Centralizes WorkflowTemplate creation used by WorkflowService and TemplateService.
 */
public final class TemplateFactory {

    private TemplateFactory() {
    }

    /**
     * Create WorkflowTemplate from WorkflowTemplateCreate (TemplateService.createTemplate).
     */
    public static WorkflowTemplate fromCreate(WorkflowTemplateCreate create, String userId, boolean isAdmin,
                                             String defaultCategory, String defaultDifficulty) {
        WorkflowTemplate t = new WorkflowTemplate();
        t.setId(UUID.randomUUID().toString());
        t.setName(create.getName());
        t.setDescription(create.getDescription());
        t.setCategory(ObjectUtils.orDefault(create.getCategory(), defaultCategory));
        t.setTags(ObjectUtils.orEmptyList(create.getTags()));
        t.setDefinition(create.getDefinition());
        t.setAuthorId(userId);
        t.setIsOfficial(Boolean.TRUE.equals(create.getIsOfficial()) && isAdmin);
        t.setDifficulty(ObjectUtils.orDefault(create.getDifficulty(), defaultDifficulty));
        t.setEstimatedTime(create.getEstimatedTime());
        return t;
    }

    /**
     * Create WorkflowTemplate from Workflow + WorkflowPublishRequest (WorkflowService.publishWorkflow).
     */
    public static WorkflowTemplate fromWorkflow(Workflow w, WorkflowPublishRequest request, String userId, boolean isAdmin,
                                               String defaultCategory, String defaultDifficulty) {
        WorkflowTemplate t = new WorkflowTemplate();
        t.setId(UUID.randomUUID().toString());
        t.setName(w.getName());
        t.setDescription(w.getDescription());
        t.setCategory(ObjectUtils.orDefault(request.getCategory(), defaultCategory));
        t.setTags(request.getTags());
        t.setDefinition(w.getDefinition());
        t.setAuthorId(userId);
        t.setIsOfficial(isAdmin);
        t.setDifficulty(ObjectUtils.orDefault(request.getDifficulty(), defaultDifficulty));
        t.setEstimatedTime(request.getEstimatedTime());
        return t;
    }
}
