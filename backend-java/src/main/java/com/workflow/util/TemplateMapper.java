package com.workflow.util;

import com.workflow.dto.WorkflowTemplateResponse;
import com.workflow.entity.WorkflowTemplate;

/**
 * DRY: Centralizes WorkflowTemplateResponse construction used by TemplateService and WorkflowService.
 */
public final class TemplateMapper {

    private TemplateMapper() {
    }

    /**
     * Convert WorkflowTemplate to WorkflowTemplateResponse.
     *
     * @param t          the template
     * @param authorName resolved author display name, or null if not needed
     */
    public static WorkflowTemplateResponse toResponse(WorkflowTemplate t, String authorName) {
        return new WorkflowTemplateResponse(
                t.getId(), t.getName(), t.getDescription(), t.getCategory(), t.getTags(),
                t.getDifficulty(), t.getEstimatedTime(), t.getIsOfficial(),
                t.getUsesCount(), t.getLikesCount(), t.getRating(),
                t.getAuthorId(), authorName, t.getThumbnailUrl(), t.getPreviewImageUrl(),
                t.getCreatedAt(), t.getUpdatedAt());
    }
}
