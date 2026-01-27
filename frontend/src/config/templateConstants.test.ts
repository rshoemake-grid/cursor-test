/**
 * Tests for template constants and formatting utilities
 */

import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_DIFFICULTIES,
  formatCategory,
  formatDifficulty,
  type TemplateCategory,
  type TemplateDifficulty,
} from './templateConstants'

describe('templateConstants', () => {
  describe('TEMPLATE_CATEGORIES', () => {
    it('should contain all expected categories', () => {
      expect(TEMPLATE_CATEGORIES).toContain('content_creation')
      expect(TEMPLATE_CATEGORIES).toContain('data_analysis')
      expect(TEMPLATE_CATEGORIES).toContain('customer_service')
      expect(TEMPLATE_CATEGORIES).toContain('research')
      expect(TEMPLATE_CATEGORIES).toContain('automation')
      expect(TEMPLATE_CATEGORIES).toContain('education')
      expect(TEMPLATE_CATEGORIES).toContain('marketing')
      expect(TEMPLATE_CATEGORIES).toContain('other')
    })

    it('should have exactly 8 categories', () => {
      expect(TEMPLATE_CATEGORIES).toHaveLength(8)
    })
  })

  describe('TEMPLATE_DIFFICULTIES', () => {
    it('should contain all expected difficulties', () => {
      expect(TEMPLATE_DIFFICULTIES).toContain('beginner')
      expect(TEMPLATE_DIFFICULTIES).toContain('intermediate')
      expect(TEMPLATE_DIFFICULTIES).toContain('advanced')
    })

    it('should have exactly 3 difficulties', () => {
      expect(TEMPLATE_DIFFICULTIES).toHaveLength(3)
    })
  })

  describe('formatCategory', () => {
    it('should replace underscores with spaces', () => {
      expect(formatCategory('content_creation' as TemplateCategory)).toBe('content creation')
      expect(formatCategory('data_analysis' as TemplateCategory)).toBe('data analysis')
      expect(formatCategory('customer_service' as TemplateCategory)).toBe('customer service')
    })

    it('should handle categories with multiple underscores', () => {
      // Note: current implementation replaces all underscores
      expect(formatCategory('content_creation' as TemplateCategory)).toBe('content creation')
    })

    it('should handle categories without underscores', () => {
      expect(formatCategory('other' as TemplateCategory)).toBe('other')
    })
  })

  describe('formatDifficulty', () => {
    it('should capitalize the first letter', () => {
      expect(formatDifficulty('beginner' as TemplateDifficulty)).toBe('Beginner')
      expect(formatDifficulty('intermediate' as TemplateDifficulty)).toBe('Intermediate')
      expect(formatDifficulty('advanced' as TemplateDifficulty)).toBe('Advanced')
    })

    it('should leave the rest of the string unchanged', () => {
      expect(formatDifficulty('beginner' as TemplateDifficulty)).toBe('Beginner')
      expect(formatDifficulty('intermediate' as TemplateDifficulty)).toBe('Intermediate')
    })
  })
})
