package com.workflow.util;

/**
 * DRY: Shared search filter logic for WorkflowDiscoveryService and TemplateService.
 */
public final class SearchUtils {

    private SearchUtils() {
    }

    /**
     * Returns true if search is null/blank, or if name or description contains search (case-insensitive).
     */
    public static boolean matchesSearch(String search, String name, String description) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String lower = search.toLowerCase();
        return (name != null && name.toLowerCase().contains(lower))
                || (description != null && description.toLowerCase().contains(lower));
    }
}
