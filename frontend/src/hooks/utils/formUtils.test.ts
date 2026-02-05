/**
 * Tests for hooks/utils/formUtils.ts
 * This file re-exports utilities from utils/formUtils.ts
 */

import * as hooksFormUtils from './formUtils'
import * as utilsFormUtils from '../../utils/formUtils'

describe('hooks/utils/formUtils', () => {
  it('should export getNestedValue', () => {
    expect(hooksFormUtils.getNestedValue).toBeDefined()
    expect(hooksFormUtils.getNestedValue).toBe(utilsFormUtils.getNestedValue)
  })

  it('should export setNestedValue', () => {
    expect(hooksFormUtils.setNestedValue).toBeDefined()
    expect(hooksFormUtils.setNestedValue).toBe(utilsFormUtils.setNestedValue)
  })

  it('should export hasNestedValue', () => {
    expect(hooksFormUtils.hasNestedValue).toBeDefined()
    expect(hooksFormUtils.hasNestedValue).toBe(utilsFormUtils.hasNestedValue)
  })

  it('should export all expected functions', () => {
    const exports = Object.keys(hooksFormUtils)
    expect(exports).toContain('getNestedValue')
    expect(exports).toContain('setNestedValue')
    expect(exports).toContain('hasNestedValue')
    expect(exports.length).toBe(3)
  })
})
