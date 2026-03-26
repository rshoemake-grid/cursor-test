/**
 * Marketplace Data Utility Functions
 * Extracted from useMarketplaceData.ts to improve testability
 */ import { logicalOr, logicalOrToEmptyArray } from '../utils/logicalOr';
/**
 * Build URL search params for API requests
 */ export function buildSearchParams(category, searchQuery, sortBy) {
    const params = new URLSearchParams();
    if (category) {
        params.append('category', category);
    }
    if (searchQuery) {
        params.append('search', searchQuery);
    }
    params.append('sort_by', sortBy);
    return params;
}
/**
 * Filter items by category
 */ export function filterByCategory(items, category) {
    if (!category) {
        return items;
    }
    return items.filter((item)=>item.category === category);
}
/**
 * Filter items by search query
 */ export function filterBySearchQuery(items, searchQuery) {
    if (!searchQuery) {
        return items;
    }
    const query = searchQuery.toLowerCase();
    return items.filter((item)=>{
        const itemName = logicalOr(item.name, '');
        const itemDescription = logicalOr(item.description, '');
        const nameStr = itemName !== null && itemName !== undefined && typeof itemName === 'string' ? itemName : '';
        const descStr = itemDescription !== null && itemDescription !== undefined && typeof itemDescription === 'string' ? itemDescription : '';
        const queryLower = query.toLowerCase();
        return nameStr.toLowerCase().includes(queryLower) || descStr.toLowerCase().includes(queryLower) || logicalOrToEmptyArray(item.tags).some((tag)=>{
            const tagStr = tag !== null && tag !== undefined && typeof tag === 'string' ? tag : '';
            return tagStr.toLowerCase().includes(queryLower);
        });
    });
}
/**
 * Apply filters to items
 */ export function applyFilters(items, category, searchQuery) {
    let filtered = items;
    filtered = filterByCategory(filtered, category);
    filtered = filterBySearchQuery(filtered, searchQuery);
    return filtered;
}
/**
 * Get timestamp for sorting (0 if no date)
 */ export function getSortTimestamp(item) {
    return item.published_at ? new Date(item.published_at).getTime() : 0;
}
/**
 * Compare items by date (newest first)
 */ export function compareByDate(a, b) {
    const dateA = getSortTimestamp(a);
    const dateB = getSortTimestamp(b);
    return dateB - dateA;
}
/**
 * Compare items by name (alphabetical)
 */ export function compareByName(a, b) {
    const nameAResult = logicalOr(a.name, '');
    const nameBResult = logicalOr(b.name, '');
    const nameA = nameAResult !== null && nameAResult !== undefined && typeof nameAResult === 'string' ? nameAResult : '';
    const nameB = nameBResult !== null && nameBResult !== undefined && typeof nameBResult === 'string' ? nameBResult : '';
    return nameA.localeCompare(nameB);
}
/**
 * Compare items prioritizing official status
 */ export function compareOfficialStatus(a, b) {
    const aIsOfficial = a.is_official ? 1 : 0;
    const bIsOfficial = b.is_official ? 1 : 0;
    return bIsOfficial - aIsOfficial // Official first
    ;
}
/**
 * Sort items by sort type
 */ export function sortItems(items, sortBy, prioritizeOfficial = false) {
    const sorted = [
        ...items
    ];
    sorted.sort((a, b)=>{
        // First, prioritize official agents if requested
        if (prioritizeOfficial) {
            const officialDiff = compareOfficialStatus(a, b);
            if (officialDiff !== 0) {
                return officialDiff;
            }
        }
        // Then apply the selected sort
        if (sortBy === 'popular' || sortBy === 'recent') {
            return compareByDate(a, b);
        }
        // Default: alphabetical by name
        return compareByName(a, b);
    });
    return sorted;
}
