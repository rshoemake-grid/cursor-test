package com.workflow.util;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

/**
 * OCP-1: Sort strategy for marketplace workflows.
 * recent -> createdAt, likes -> likesCount, popular/default -> usesCount
 */
@Component("workflowSortStrategy")
public class WorkflowSortStrategy implements SortStrategy {
    @Override
    public Sort getSort(String sortBy) {
        return switch (SortStrategy.normalizeSortBy(sortBy)) {
            case "recent" -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "likes" -> Sort.by(Sort.Direction.DESC, "likesCount");
            default -> Sort.by(Sort.Direction.DESC, "usesCount");
        };
    }
}
