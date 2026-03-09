package com.workflow.util;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

/**
 * OCP-2: Sort strategy for templates.
 * recent -> createdAt, rating -> rating, default -> usesCount
 */
@Component("templateSortStrategy")
public class TemplateSortStrategy implements SortStrategy {
    @Override
    public Sort getSort(String sortBy) {
        return switch (SortStrategy.normalizeSortBy(sortBy)) {
            case "recent" -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "rating" -> Sort.by(Sort.Direction.DESC, "rating");
            default -> Sort.by(Sort.Direction.DESC, "usesCount");
        };
    }
}
