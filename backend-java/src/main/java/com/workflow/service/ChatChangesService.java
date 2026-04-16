package com.workflow.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Applies workflow-chat tool edits to a workflow definition (extracted for testability; implemented by {@link WorkflowService}).
 */
public interface ChatChangesService {

    Map<String, Object> applyChatChanges(
            String workflowId,
            List<Map<String, Object>> nodesToAdd,
            List<Map<String, Object>> nodesToUpdate,
            List<String> nodesToDelete,
            List<Map<String, Object>> edgesToAdd,
            List<Map<String, Object>> edgesToDelete,
            Optional<String> nameUpdate,
            boolean updateDescription,
            String descriptionValue,
            String userId);
}
