package com.workflow.dto;

import com.workflow.util.ErrorMessages;

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
            result.put("message", ErrorMessages.bulkDeletePartial(deletedCount, failedIds.size()));
            result.put("failed_ids", failedIds);
        } else {
            result.put("message", ErrorMessages.bulkDeleteSuccess(deletedCount));
        }
        return result;
    }
}
