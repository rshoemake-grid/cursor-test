package com.workflow.util;

/**
 * DRY: Shared pagination logic for WorkflowDiscoveryService, PublishedAgentService, ExecutionStatsService, TemplateService.
 */
public final class PaginationUtils {

    private static final int DEFAULT_MAX_LIMIT = 100;
    /** Default page size when limit is null or <= 0. */
    public static final int DEFAULT_PAGE_SIZE = 50;

    private PaginationUtils() {
    }

    /**
     * Resolve page size from nullable limit. Returns DEFAULT_PAGE_SIZE when limit is null or <= 0,
     * otherwise clamps to [1, DEFAULT_MAX_LIMIT].
     */
    public static int resolvePageSize(Integer limit) {
        return clampLimit(limit != null && limit > 0 ? limit : DEFAULT_PAGE_SIZE);
    }

    /**
     * Clamp limit to [1, maxLimit]. Default max is 100.
     */
    public static int clampLimit(int limit, int maxLimit) {
        return Math.max(1, Math.min(limit, maxLimit > 0 ? maxLimit : DEFAULT_MAX_LIMIT));
    }

    /**
     * Clamp limit to [1, 100].
     */
    public static int clampLimit(int limit) {
        return clampLimit(limit, DEFAULT_MAX_LIMIT);
    }

    /**
     * Fetch size for offset + limit pagination (when fetching then slicing in memory).
     */
    public static int fetchSize(int offset, int limit) {
        return offset + limit;
    }
}
