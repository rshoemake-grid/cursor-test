package com.workflow.util;

import org.springframework.data.domain.Sort;

/**
 * OCP-1, OCP-2: Strategy for sort behavior - open for extension without modifying services.
 */
@FunctionalInterface
public interface SortStrategy {
    Sort getSort(String sortBy);
}
