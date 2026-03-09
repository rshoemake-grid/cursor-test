package com.workflow.util;

import org.springframework.data.domain.Sort;

/**
 * OCP-1, OCP-2: Strategy for sort behavior - open for extension without modifying services.
 */
@FunctionalInterface
public interface SortStrategy {
    String DEFAULT_SORT = "popular";

    Sort getSort(String sortBy);

    /** DRY: Normalize sortBy with default; used by TemplateSortStrategy and WorkflowSortStrategy. */
    static String normalizeSortBy(String sortBy) {
        return ObjectUtils.orDefault(sortBy, DEFAULT_SORT);
    }
}
