package com.workflow.dto;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Result of bulk delete operation. SRP: Separates response shape from WorkflowService.
 */
public record BulkDeleteResult(int deletedCount, List<String> failedIds) {

    public Map<String, Object> toMap() {
        Map<String, Object> result = new HashMap<>();
        result.put("deleted_count", deletedCount);
        if (failedIds != null && !failedIds.isEmpty()) {
            result.put("message", "Deleted " + deletedCount + " workflow(s). " + failedIds.size() + " could not be deleted.");
            result.put("failed_ids", failedIds);
        } else {
            result.put("message", "Successfully deleted " + deletedCount + " workflow(s)");
        }
        return result;
    }
}
