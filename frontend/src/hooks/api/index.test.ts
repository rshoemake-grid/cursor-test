/**
 * Tests for hooks/api/index.ts barrel export
 * 
 * This file tests that the barrel export correctly re-exports
 * all API-related hooks and maintains consistency with the domain pattern.
 * 
 * IMPORTANT: We import the module itself to ensure the export statement is executed.
 * This is necessary for coverage to count the export statement.
 */

// Import the barrel export module to execute its export statement
import * as apiIndex from './index'
import { useAuthenticatedApi } from './index'
import { useAuthenticatedApi as useAuthenticatedApiDirect } from './useAuthenticatedApi'

describe('hooks/api/index.ts', () => {
  describe('barrel export', () => {
    it('should export useAuthenticatedApi', () => {
      expect(useAuthenticatedApi).toBeDefined()
      expect(typeof useAuthenticatedApi).toBe('function')
    })

    it('should export the same useAuthenticatedApi as the direct import', () => {
      // Verify that the barrel export is the same reference as the direct import
      expect(useAuthenticatedApi).toBe(useAuthenticatedApiDirect)
    })

    it('should allow importing useAuthenticatedApi from the barrel export', () => {
      // Test that the import works correctly
      const importedHook = useAuthenticatedApi
      expect(importedHook).toBeDefined()
      expect(importedHook).toBe(useAuthenticatedApiDirect)
    })

    it('should export useAuthenticatedApi via namespace import', () => {
      // Import the module namespace to ensure the export statement is executed
      expect(apiIndex.useAuthenticatedApi).toBeDefined()
      expect(apiIndex.useAuthenticatedApi).toBe(useAuthenticatedApiDirect)
    })

    it('should maintain consistency with domain pattern', () => {
      // Verify that the export follows the domain pattern
      // All domains use index.ts for exports
      expect(useAuthenticatedApi).toBeDefined()
      expect(apiIndex.useAuthenticatedApi).toBeDefined()
    })

    it('should execute the export statement via require', () => {
      // Force execution of the export by requiring the module
      // This ensures coverage counts the export statement
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- Dynamic require needed for Jest mocking
      const requiredModule = require('./index')
      expect(requiredModule.useAuthenticatedApi).toBeDefined()
      expect(requiredModule.useAuthenticatedApi).toBe(useAuthenticatedApiDirect)
    })
  })
})
