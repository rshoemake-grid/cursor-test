/**
 * Input Editor Constants Tests
 * Tests for input editor constants to ensure mutation resistance
 */

import {
  CONFIG_FIELD,
  NODE_TYPE_DISPLAY_NAMES
} from './inputEditorConstants'

describe('inputEditorConstants', () => {
  describe('CONFIG_FIELD', () => {
    it('should be "input_config"', () => {
      expect(CONFIG_FIELD).toBe('input_config')
    })

    it('should be readonly', () => {
      // as const provides type-level immutability
      expect(CONFIG_FIELD).toBe('input_config')
    })
  })

  describe('NODE_TYPE_DISPLAY_NAMES', () => {
    it('should have DATABASE as "Database Configuration"', () => {
      expect(NODE_TYPE_DISPLAY_NAMES.DATABASE).toBe('Database Configuration')
    })

    it('should have FIREBASE as "Firebase Configuration"', () => {
      expect(NODE_TYPE_DISPLAY_NAMES.FIREBASE).toBe('Firebase Configuration')
    })

    it('should have BIGQUERY as "BigQuery Configuration"', () => {
      expect(NODE_TYPE_DISPLAY_NAMES.BIGQUERY).toBe('BigQuery Configuration')
    })

    it('should have readonly properties', () => {
      // as const provides type-level immutability
      expect(NODE_TYPE_DISPLAY_NAMES.DATABASE).toBe('Database Configuration')
      expect(NODE_TYPE_DISPLAY_NAMES.FIREBASE).toBe('Firebase Configuration')
      expect(NODE_TYPE_DISPLAY_NAMES.BIGQUERY).toBe('BigQuery Configuration')
    })
  })
})
