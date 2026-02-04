/**
 * Marketplace Data Utility Functions
 * Extracted from useMarketplaceData.ts to improve testability
 */

export interface FilterableItem {
  category?: string
  name?: string
  description?: string
  tags?: string[]
}

export interface SortableItem {
  name?: string | null
  published_at?: string | null
  is_official?: boolean
}

/**
 * Build URL search params for API requests
 */
export function buildSearchParams(
  category: string,
  searchQuery: string,
  sortBy: string
): URLSearchParams {
  const params = new URLSearchParams()
  if (category) {
    params.append('category', category)
  }
  if (searchQuery) {
    params.append('search', searchQuery)
  }
  params.append('sort_by', sortBy)
  return params
}

/**
 * Filter items by category
 */
export function filterByCategory<T extends FilterableItem>(
  items: T[],
  category: string
): T[] {
  if (!category) {
    return items
  }
  return items.filter(item => item.category === category)
}

/**
 * Filter items by search query
 */
export function filterBySearchQuery<T extends FilterableItem>(
  items: T[],
  searchQuery: string
): T[] {
  if (!searchQuery) {
    return items
  }
  
  const query = searchQuery.toLowerCase()
  return items.filter(item => 
    (item.name || '').toLowerCase().includes(query) || 
    (item.description || '').toLowerCase().includes(query) ||
    (item.tags || []).some(tag => tag.toLowerCase().includes(query))
  )
}

/**
 * Apply filters to items
 */
export function applyFilters<T extends FilterableItem>(
  items: T[],
  category: string,
  searchQuery: string
): T[] {
  let filtered = items
  filtered = filterByCategory(filtered, category)
  filtered = filterBySearchQuery(filtered, searchQuery)
  return filtered
}

/**
 * Get timestamp for sorting (0 if no date)
 */
export function getSortTimestamp(item: SortableItem): number {
  return item.published_at ? new Date(item.published_at).getTime() : 0
}

/**
 * Compare items by date (newest first)
 */
export function compareByDate(a: SortableItem, b: SortableItem): number {
  const dateA = getSortTimestamp(a)
  const dateB = getSortTimestamp(b)
  return dateB - dateA
}

/**
 * Compare items by name (alphabetical)
 */
export function compareByName(a: SortableItem, b: SortableItem): number {
  const nameA = a.name || ''
  const nameB = b.name || ''
  return nameA.localeCompare(nameB)
}

/**
 * Compare items prioritizing official status
 */
export function compareOfficialStatus(a: SortableItem, b: SortableItem): number {
  const aIsOfficial = a.is_official ? 1 : 0
  const bIsOfficial = b.is_official ? 1 : 0
  return bIsOfficial - aIsOfficial // Official first
}

/**
 * Sort items by sort type
 */
export function sortItems<T extends SortableItem>(
  items: T[],
  sortBy: string,
  prioritizeOfficial: boolean = false
): T[] {
  const sorted = [...items]
  
  sorted.sort((a, b) => {
    // First, prioritize official agents if requested
    if (prioritizeOfficial) {
      const officialDiff = compareOfficialStatus(a, b)
      if (officialDiff !== 0) {
        return officialDiff
      }
    }
    
    // Then apply the selected sort
    if (sortBy === 'popular' || sortBy === 'recent') {
      return compareByDate(a, b)
    }
    
    // Default: alphabetical by name
    return compareByName(a, b)
  })
  
  return sorted
}
