/**
 * Difficulty Colors Utility Tests
 * Tests for difficulty color mapping utility
 */

import { getDifficultyColor } from './difficultyColors'

describe('getDifficultyColor', () => {
  it('should return green colors for beginner', () => {
    expect(getDifficultyColor('beginner')).toBe('bg-green-100 text-green-800')
  })

  it('should return yellow colors for intermediate', () => {
    expect(getDifficultyColor('intermediate')).toBe('bg-yellow-100 text-yellow-800')
  })

  it('should return red colors for advanced', () => {
    expect(getDifficultyColor('advanced')).toBe('bg-red-100 text-red-800')
  })

  it('should return gray colors for unknown difficulty', () => {
    expect(getDifficultyColor('unknown')).toBe('bg-gray-100 text-gray-800')
    expect(getDifficultyColor('')).toBe('bg-gray-100 text-gray-800')
    expect(getDifficultyColor('expert')).toBe('bg-gray-100 text-gray-800')
  })

  it('should handle case sensitivity', () => {
    expect(getDifficultyColor('BEGINNER')).toBe('bg-gray-100 text-gray-800')
    expect(getDifficultyColor('Intermediate')).toBe('bg-gray-100 text-gray-800')
  })
})
