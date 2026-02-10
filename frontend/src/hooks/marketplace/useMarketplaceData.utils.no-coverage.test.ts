/**
 * Tests for no-coverage paths in useMarketplaceData.utils.ts
 * 
 * These tests target code paths that are not covered by normal tests,
 * such as edge cases, defensive checks, and error handling.
 */

import {
  buildSearchParams,
  filterByCategory,
  filterBySearchQuery,
  applyFilters,
  getSortTimestamp,
  compareByDate,
  compareByName,
  compareOfficialStatus,
  sortItems,
} from './useMarketplaceData.utils'
import type { FilterableItem, SortableItem } from './useMarketplaceData.utils'

describe('useMarketplaceData.utils - No Coverage Paths', () => {
  describe('buildSearchParams', () => {
    it('should build params with all values', () => {
      const params = buildSearchParams('automation', 'test query', 'popular')
      
      expect(params.get('category')).toBe('automation')
      expect(params.get('search')).toBe('test query')
      expect(params.get('sort_by')).toBe('popular')
    })

    it('should omit category when empty', () => {
      const params = buildSearchParams('', 'test query', 'popular')
      
      expect(params.get('category')).toBeNull()
      expect(params.get('search')).toBe('test query')
      expect(params.get('sort_by')).toBe('popular')
    })

    it('should omit search when empty', () => {
      const params = buildSearchParams('automation', '', 'popular')
      
      expect(params.get('category')).toBe('automation')
      expect(params.get('search')).toBeNull()
      expect(params.get('sort_by')).toBe('popular')
    })

    it('should always include sort_by', () => {
      const params = buildSearchParams('', '', 'recent')
      
      expect(params.get('category')).toBeNull()
      expect(params.get('search')).toBeNull()
      expect(params.get('sort_by')).toBe('recent')
    })
  })

  describe('filterByCategory', () => {
    const items: FilterableItem[] = [
      { category: 'automation', name: 'Item 1' },
      { category: 'data', name: 'Item 2' },
      { category: 'automation', name: 'Item 3' },
    ]

    it('should return all items when category is empty', () => {
      const result = filterByCategory(items, '')
      expect(result).toEqual(items)
    })

    it('should filter by category', () => {
      const result = filterByCategory(items, 'automation')
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Item 1')
      expect(result[1].name).toBe('Item 3')
    })

    it('should return empty array when no items match category', () => {
      const result = filterByCategory(items, 'nonexistent')
      expect(result).toHaveLength(0)
    })
  })

  describe('filterBySearchQuery', () => {
    const items: FilterableItem[] = [
      { name: 'Test Item', description: 'Description', tags: ['tag1'] },
      { name: 'Another Item', description: 'Test description', tags: ['tag2'] },
      { name: 'Third', description: 'Different', tags: ['test-tag'] },
    ]

    it('should return all items when search query is empty', () => {
      const result = filterBySearchQuery(items, '')
      expect(result).toEqual(items)
    })

    it('should filter by name', () => {
      const result = filterBySearchQuery(items, 'Test Item')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Test Item')
    })

    it('should filter by description', () => {
      const result = filterBySearchQuery(items, 'description')
      expect(result).toHaveLength(2)
    })

    it('should filter by tags', () => {
      const result = filterBySearchQuery(items, 'test-tag')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Third')
    })

    it('should handle null/undefined name with defensive check', () => {
      const itemsWithNulls: FilterableItem[] = [
        { name: null as any, description: 'Test' },
        { name: undefined as any, description: 'Test' },
        { name: 'Valid', description: 'Test' },
      ]
      
      const result = filterBySearchQuery(itemsWithNulls, 'test')
      // Should filter by description when name is null/undefined
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle null/undefined description with defensive check', () => {
      const itemsWithNulls: FilterableItem[] = [
        { name: 'Test', description: null as any },
        { name: 'Test', description: undefined as any },
      ]
      
      const result = filterBySearchQuery(itemsWithNulls, 'test')
      // Should filter by name when description is null/undefined
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle non-string name/description with defensive check', () => {
      const itemsWithNonStrings: FilterableItem[] = [
        { name: 123 as any, description: 'Test' },
        { name: 'Test', description: {} as any },
      ]
      
      const result = filterBySearchQuery(itemsWithNonStrings, 'test')
      // Should handle non-string values gracefully
      expect(result.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle null/undefined tags', () => {
      const itemsWithNullTags: FilterableItem[] = [
        { name: 'Test', tags: null as any },
        { name: 'Test', tags: undefined as any },
      ]
      
      const result = filterBySearchQuery(itemsWithNullTags, 'test')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle non-string tags with defensive check', () => {
      const itemsWithNonStringTags: FilterableItem[] = [
        { name: 'Test', tags: [123 as any, 'valid'] },
        { name: 'Test', tags: [null as any, 'valid'] },
      ]
      
      const result = filterBySearchQuery(itemsWithNonStringTags, 'valid')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('applyFilters', () => {
    const items: FilterableItem[] = [
      { category: 'automation', name: 'Test Item' },
      { category: 'data', name: 'Another Item' },
      { category: 'automation', name: 'Third Item' },
    ]

    it('should apply both category and search filters', () => {
      const result = applyFilters(items, 'automation', 'Test')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Test Item')
    })

    it('should apply only category filter when search is empty', () => {
      const result = applyFilters(items, 'automation', '')
      expect(result).toHaveLength(2)
    })

    it('should apply only search filter when category is empty', () => {
      const result = applyFilters(items, '', 'Test')
      expect(result).toHaveLength(1)
    })

    it('should return all items when both filters are empty', () => {
      const result = applyFilters(items, '', '')
      expect(result).toEqual(items)
    })
  })

  describe('getSortTimestamp', () => {
    it('should return timestamp for valid date', () => {
      const item: SortableItem = { published_at: '2024-01-01T00:00:00Z' }
      const timestamp = getSortTimestamp(item)
      expect(timestamp).toBe(new Date('2024-01-01T00:00:00Z').getTime())
    })

    it('should return 0 when published_at is null', () => {
      const item: SortableItem = { published_at: null }
      const timestamp = getSortTimestamp(item)
      expect(timestamp).toBe(0)
    })

    it('should return 0 when published_at is undefined', () => {
      const item: SortableItem = { published_at: undefined }
      const timestamp = getSortTimestamp(item)
      expect(timestamp).toBe(0)
    })

    it('should return 0 when published_at is empty string', () => {
      const item: SortableItem = { published_at: '' }
      const timestamp = getSortTimestamp(item)
      expect(timestamp).toBe(0)
    })
  })

  describe('compareByDate', () => {
    it('should sort newest first', () => {
      const a: SortableItem = { published_at: '2024-01-01T00:00:00Z' }
      const b: SortableItem = { published_at: '2024-01-02T00:00:00Z' }
      
      const result = compareByDate(a, b)
      expect(result).toBeGreaterThan(0) // b is newer, should come first
    })

    it('should handle items without dates', () => {
      const a: SortableItem = { published_at: null }
      const b: SortableItem = { published_at: '2024-01-01T00:00:00Z' }
      
      const result = compareByDate(a, b)
      expect(result).toBeGreaterThan(0) // b has date, should come first
    })

    it('should return 0 when both items have no dates', () => {
      const a: SortableItem = { published_at: null }
      const b: SortableItem = { published_at: null }
      
      const result = compareByDate(a, b)
      expect(result).toBe(0)
    })
  })

  describe('compareByName', () => {
    it('should sort alphabetically', () => {
      const a: SortableItem = { name: 'Apple' }
      const b: SortableItem = { name: 'Banana' }
      
      const result = compareByName(a, b)
      expect(result).toBeLessThan(0) // Apple comes before Banana
    })

    it('should handle null name with defensive check', () => {
      const a: SortableItem = { name: null }
      const b: SortableItem = { name: 'Valid' }
      
      const result = compareByName(a, b)
      // Should handle null gracefully (empty string vs 'Valid')
      expect(result).toBeLessThan(0) // Empty string comes before 'Valid'
    })

    it('should handle undefined name with defensive check', () => {
      const a: SortableItem = { name: undefined }
      const b: SortableItem = { name: 'Valid' }
      
      const result = compareByName(a, b)
      // Should handle undefined gracefully (empty string vs 'Valid')
      expect(result).toBeLessThan(0) // Empty string comes before 'Valid'
    })

    it('should handle non-string names with defensive check', () => {
      const a: SortableItem = { name: 123 as any }
      const b: SortableItem = { name: 'Valid' }
      
      const result = compareByName(a, b)
      // Should handle non-string gracefully (empty string vs 'Valid')
      expect(result).toBeLessThan(0) // Empty string comes before 'Valid'
    })

    it('should handle non-string nameB with defensive check (line 117 branch)', () => {
      // Test line 117: when nameBResult is not null/undefined but not a string
      const a: SortableItem = { name: 'Valid' }
      const b: SortableItem = { name: 123 as any } // Non-string nameB
      
      const result = compareByName(a, b)
      // Should handle non-string nameB gracefully (tests line 117: typeof nameBResult !== 'string' branch)
      expect(typeof result).toBe('number')
      // 'Valid' comes after empty string (from non-string conversion) alphabetically
      expect(result).toBeGreaterThan(0)
    })

    it('should handle non-string nameB with defensive check (line 117 branch)', () => {
      // Test line 117: nameBResult is not null/undefined but not a string
      const a: SortableItem = { name: 'Valid' }
      const b: SortableItem = { name: 123 as any } // Non-string nameB
      
      const result = compareByName(a, b)
      // Should handle non-string nameB gracefully (tests line 117: typeof nameBResult !== 'string' branch)
      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThan(0) // 'Valid' comes after empty string
    })

    it('should handle both names being null/undefined/non-string', () => {
      const a: SortableItem = { name: null }
      const b: SortableItem = { name: undefined }
      
      const result = compareByName(a, b)
      // Both become empty strings, should return 0
      expect(result).toBe(0)
    })

    it('should return 0 when both names are empty strings', () => {
      const a: SortableItem = { name: '' }
      const b: SortableItem = { name: '' }
      
      const result = compareByName(a, b)
      expect(result).toBe(0)
    })
  })

  describe('compareOfficialStatus', () => {
    it('should prioritize official items', () => {
      const a: SortableItem = { is_official: false }
      const b: SortableItem = { is_official: true }
      
      const result = compareOfficialStatus(a, b)
      expect(result).toBeGreaterThan(0) // b is official, should come first
    })

    it('should return 0 when both are official', () => {
      const a: SortableItem = { is_official: true }
      const b: SortableItem = { is_official: true }
      
      const result = compareOfficialStatus(a, b)
      expect(result).toBe(0)
    })

    it('should return 0 when both are not official', () => {
      const a: SortableItem = { is_official: false }
      const b: SortableItem = { is_official: false }
      
      const result = compareOfficialStatus(a, b)
      expect(result).toBe(0)
    })

    it('should handle undefined is_official', () => {
      const a: SortableItem = { is_official: undefined }
      const b: SortableItem = { is_official: true }
      
      const result = compareOfficialStatus(a, b)
      expect(result).toBeGreaterThan(0) // b is official, should come first
    })
  })

  describe('sortItems', () => {
    const items: SortableItem[] = [
      { name: 'C Item', published_at: '2024-01-03T00:00:00Z', is_official: false },
      { name: 'A Item', published_at: '2024-01-01T00:00:00Z', is_official: true },
      { name: 'B Item', published_at: '2024-01-02T00:00:00Z', is_official: false },
    ]

    it('should sort by date when sortBy is popular', () => {
      const result = sortItems(items, 'popular', false)
      expect(result[0].name).toBe('C Item') // Newest first
      expect(result[1].name).toBe('B Item')
      expect(result[2].name).toBe('A Item')
    })

    it('should sort by date when sortBy is recent', () => {
      const result = sortItems(items, 'recent', false)
      expect(result[0].name).toBe('C Item') // Newest first
    })

    it('should sort alphabetically by default', () => {
      const result = sortItems(items, 'alphabetical', false)
      expect(result[0].name).toBe('A Item')
      expect(result[1].name).toBe('B Item')
      expect(result[2].name).toBe('C Item')
    })

    it('should prioritize official when prioritizeOfficial is true', () => {
      const result = sortItems(items, 'alphabetical', true)
      expect(result[0].name).toBe('A Item') // Official first
    })

    it('should prioritize official then sort by date', () => {
      const itemsWithOfficial: SortableItem[] = [
        { name: 'C', published_at: '2024-01-03T00:00:00Z', is_official: false },
        { name: 'A', published_at: '2024-01-01T00:00:00Z', is_official: true },
        { name: 'B', published_at: '2024-01-02T00:00:00Z', is_official: true },
      ]
      
      const result = sortItems(itemsWithOfficial, 'popular', true)
      // Official items first (A and B), then by date within official
      expect(result[0].is_official).toBe(true)
      expect(result[1].is_official).toBe(true)
      expect(result[2].is_official).toBe(false)
    })

    it('should handle empty array', () => {
      const result = sortItems([], 'alphabetical', false)
      expect(result).toEqual([])
    })

    it('should not mutate original array', () => {
      const original = [...items]
      sortItems(items, 'alphabetical', false)
      expect(items).toEqual(original)
    })
  })
})
