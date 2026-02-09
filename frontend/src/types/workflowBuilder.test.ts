/**
 * Tests for types/workflowBuilder.ts type definitions
 * 
 * This file tests that WorkflowBuilder prop types are correctly defined
 * and follow the Interface Segregation Principle (ISP).
 */

import type {
  WorkflowBuilderCoreProps,
  WorkflowBuilderExecutionProps,
  WorkflowBuilderPersistenceProps,
  WorkflowBuilderDependencyProps,
  WorkflowBuilderProps,
} from './workflowBuilder'
import {
  hasWorkflowBuilderCoreProps,
  hasWorkflowBuilderExecutionProps,
  hasWorkflowBuilderPersistenceProps,
  hasWorkflowBuilderDependencyProps,
  isValidWorkflowBuilderProps,
} from './workflowBuilder'
// Import the module to ensure all runtime code is executed
import * as workflowBuilderModule from './workflowBuilder'
import type { StorageAdapter } from './adapters'
import type { Execution } from '../contexts/WorkflowTabsContext'

describe('types/workflowBuilder.ts', () => {
  describe('WorkflowBuilderCoreProps', () => {
    it('should create valid WorkflowBuilderCoreProps object', () => {
      const props: WorkflowBuilderCoreProps = {
        tabId: 'tab-1',
        workflowId: 'workflow-1',
        tabName: 'Test Workflow',
        tabIsUnsaved: false,
      }
      expect(props.tabId).toBe('tab-1')
      expect(props.workflowId).toBe('workflow-1')
      expect(props.tabName).toBe('Test Workflow')
      expect(props.tabIsUnsaved).toBe(false)
    })

    it('should allow workflowId to be null', () => {
      const props: WorkflowBuilderCoreProps = {
        tabId: 'tab-1',
        workflowId: null,
        tabName: 'New Workflow',
        tabIsUnsaved: true,
      }
      expect(props.workflowId).toBeNull()
      expect(props.tabIsUnsaved).toBe(true)
    })
  })

  describe('WorkflowBuilderExecutionProps', () => {
    it('should create valid WorkflowBuilderExecutionProps object', () => {
      const mockExecution: Execution = {
        id: 'exec-1',
        status: 'running',
        started_at: '2024-01-01T00:00:00Z',
      }

      const props: WorkflowBuilderExecutionProps = {
        workflowTabs: [
          {
            workflowId: 'workflow-1',
            workflowName: 'Test Workflow',
            executions: [mockExecution],
            activeExecutionId: 'exec-1',
          },
        ],
        onExecutionStart: jest.fn(),
        onExecutionLogUpdate: jest.fn(),
        onExecutionStatusUpdate: jest.fn(),
        onExecutionNodeUpdate: jest.fn(),
        onRemoveExecution: jest.fn(),
        onClearExecutions: jest.fn(),
      }

      expect(props.workflowTabs).toHaveLength(1)
      expect(props.onExecutionStart).toBeDefined()
      expect(props.onExecutionLogUpdate).toBeDefined()
    })

    it('should allow all execution callbacks to be optional', () => {
      const props: Partial<WorkflowBuilderExecutionProps> = {
        onExecutionStart: jest.fn(),
      }
      expect(props.onExecutionStart).toBeDefined()
      expect(props.onExecutionLogUpdate).toBeUndefined()
    })
  })

  describe('WorkflowBuilderPersistenceProps', () => {
    it('should create valid WorkflowBuilderPersistenceProps object', () => {
      const props: WorkflowBuilderPersistenceProps = {
        onWorkflowSaved: jest.fn(),
        onWorkflowModified: jest.fn(),
        onWorkflowLoaded: jest.fn(),
        onCloseWorkflow: jest.fn(),
      }

      expect(props.onWorkflowSaved).toBeDefined()
      expect(props.onWorkflowModified).toBeDefined()
      expect(props.onWorkflowLoaded).toBeDefined()
      expect(props.onCloseWorkflow).toBeDefined()
    })

    it('should allow persistence callbacks to be optional', () => {
      const props: Partial<WorkflowBuilderPersistenceProps> = {
        onWorkflowSaved: jest.fn(),
      }
      expect(props.onWorkflowSaved).toBeDefined()
      expect(props.onWorkflowModified).toBeUndefined()
    })
  })

  describe('WorkflowBuilderDependencyProps', () => {
    it('should create valid WorkflowBuilderDependencyProps with storage adapter', () => {
      const mockStorage: StorageAdapter = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      const props: WorkflowBuilderDependencyProps = {
        storage: mockStorage,
      }

      expect(props.storage).toBe(mockStorage)
    })

    it('should allow storage to be null', () => {
      const props: WorkflowBuilderDependencyProps = {
        storage: null,
      }
      expect(props.storage).toBeNull()
    })

    it('should allow storage to be undefined', () => {
      const props: Partial<WorkflowBuilderDependencyProps> = {}
      expect(props.storage).toBeUndefined()
    })
  })

  describe('WorkflowBuilderProps', () => {
    it('should combine all prop interfaces correctly', () => {
      const mockStorage: StorageAdapter = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      const props: WorkflowBuilderProps = {
        // Core props (required)
        tabId: 'tab-1',
        workflowId: 'workflow-1',
        tabName: 'Test Workflow',
        tabIsUnsaved: false,
        // Execution props (optional)
        onExecutionStart: jest.fn(),
        // Persistence props (optional)
        onWorkflowSaved: jest.fn(),
        // Dependency props (optional)
        storage: mockStorage,
      }

      expect(props.tabId).toBe('tab-1')
      expect(props.workflowId).toBe('workflow-1')
      expect(props.onExecutionStart).toBeDefined()
      expect(props.onWorkflowSaved).toBeDefined()
      expect(props.storage).toBe(mockStorage)
    })

    it('should allow minimal props with only core properties', () => {
      const props: WorkflowBuilderProps = {
        tabId: 'tab-1',
        workflowId: null,
        tabName: 'New Workflow',
        tabIsUnsaved: true,
      }

      expect(props.tabId).toBe('tab-1')
      expect(props.workflowId).toBeNull()
      expect(props.onExecutionStart).toBeUndefined()
      expect(props.storage).toBeUndefined()
    })

    it('should follow Interface Segregation Principle - allow partial props', () => {
      // Client can depend only on core props
      const coreOnly: WorkflowBuilderCoreProps = {
        tabId: 'tab-1',
        workflowId: 'workflow-1',
        tabName: 'Test',
        tabIsUnsaved: false,
      }

      // Client can depend only on execution props
      const executionOnly: Partial<WorkflowBuilderExecutionProps> = {
        onExecutionStart: jest.fn(),
      }

      // Client can depend only on persistence props
      const persistenceOnly: Partial<WorkflowBuilderPersistenceProps> = {
        onWorkflowSaved: jest.fn(),
      }

      expect(coreOnly.tabId).toBe('tab-1')
      expect(executionOnly.onExecutionStart).toBeDefined()
      expect(persistenceOnly.onWorkflowSaved).toBeDefined()
    })

    it('should allow combining any subset of optional props', () => {
      const props1: WorkflowBuilderProps = {
        tabId: 'tab-1',
        workflowId: 'workflow-1',
        tabName: 'Test',
        tabIsUnsaved: false,
        onExecutionStart: jest.fn(),
        // No persistence or storage props
      }

      const props2: WorkflowBuilderProps = {
        tabId: 'tab-2',
        workflowId: null,
        tabName: 'Test 2',
        tabIsUnsaved: true,
        onWorkflowSaved: jest.fn(),
        storage: null,
        // No execution props
      }

      expect(props1.onExecutionStart).toBeDefined()
      expect(props1.onWorkflowSaved).toBeUndefined()
      expect(props2.onWorkflowSaved).toBeDefined()
      expect(props2.onExecutionStart).toBeUndefined()
    })
  })

  describe('type compatibility', () => {
    it('should allow WorkflowBuilderProps to be assigned from core props', () => {
      const coreProps: WorkflowBuilderCoreProps = {
        tabId: 'tab-1',
        workflowId: 'workflow-1',
        tabName: 'Test',
        tabIsUnsaved: false,
      }

      const fullProps: WorkflowBuilderProps = coreProps
      expect(fullProps.tabId).toBe('tab-1')
    })

    it('should allow WorkflowBuilderProps to include all optional props', () => {
      const mockStorage: StorageAdapter = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      const props: WorkflowBuilderProps = {
        tabId: 'tab-1',
        workflowId: 'workflow-1',
        tabName: 'Test',
        tabIsUnsaved: false,
        workflowTabs: [],
        onExecutionStart: jest.fn(),
        onExecutionLogUpdate: jest.fn(),
        onExecutionStatusUpdate: jest.fn(),
        onExecutionNodeUpdate: jest.fn(),
        onRemoveExecution: jest.fn(),
        onClearExecutions: jest.fn(),
        onWorkflowSaved: jest.fn(),
        onWorkflowModified: jest.fn(),
        onWorkflowLoaded: jest.fn(),
        onCloseWorkflow: jest.fn(),
        storage: mockStorage,
      }

      expect(props.tabId).toBe('tab-1')
      expect(props.workflowTabs).toEqual([])
      expect(props.storage).toBe(mockStorage)
    })
  })

  describe('runtime validation functions', () => {
    describe('hasWorkflowBuilderCoreProps', () => {
      it('should validate objects with required core props', () => {
        const valid = {
          tabId: 'tab-1',
          workflowId: 'workflow-1',
          tabName: 'Test',
          tabIsUnsaved: false,
        }
        expect(hasWorkflowBuilderCoreProps(valid)).toBe(true)
      })

      it('should validate objects with null workflowId', () => {
        const valid = {
          tabId: 'tab-1',
          workflowId: null,
          tabName: 'Test',
          tabIsUnsaved: true,
        }
        expect(hasWorkflowBuilderCoreProps(valid)).toBe(true)
      })

      it('should reject invalid objects', () => {
        expect(hasWorkflowBuilderCoreProps({})).toBe(false)
        expect(hasWorkflowBuilderCoreProps(null)).toBe(false)
        expect(hasWorkflowBuilderCoreProps(undefined)).toBe(false)
        expect(hasWorkflowBuilderCoreProps({ tabId: 'tab-1' })).toBe(false)
      })
    })

    describe('hasWorkflowBuilderExecutionProps', () => {
      it('should validate any object', () => {
        expect(hasWorkflowBuilderExecutionProps({})).toBe(true)
        expect(hasWorkflowBuilderExecutionProps({ onExecutionStart: jest.fn() })).toBe(true)
      })

      it('should reject non-objects', () => {
        expect(hasWorkflowBuilderExecutionProps(null)).toBe(false)
        expect(hasWorkflowBuilderExecutionProps(undefined)).toBe(false)
        expect(hasWorkflowBuilderExecutionProps('string')).toBe(false)
      })
    })

    describe('hasWorkflowBuilderPersistenceProps', () => {
      it('should validate any object', () => {
        expect(hasWorkflowBuilderPersistenceProps({})).toBe(true)
        expect(hasWorkflowBuilderPersistenceProps({ onWorkflowSaved: jest.fn() })).toBe(true)
      })

      it('should reject non-objects', () => {
        expect(hasWorkflowBuilderPersistenceProps(null)).toBe(false)
        expect(hasWorkflowBuilderPersistenceProps(undefined)).toBe(false)
      })
    })

    describe('hasWorkflowBuilderDependencyProps', () => {
      it('should validate any object', () => {
        expect(hasWorkflowBuilderDependencyProps({})).toBe(true)
        expect(hasWorkflowBuilderDependencyProps({ storage: null })).toBe(true)
      })

      it('should reject non-objects', () => {
        expect(hasWorkflowBuilderDependencyProps(null)).toBe(false)
        expect(hasWorkflowBuilderDependencyProps(undefined)).toBe(false)
      })
    })

    describe('isValidWorkflowBuilderProps', () => {
      it('should validate complete WorkflowBuilderProps', () => {
        const props: WorkflowBuilderProps = {
          tabId: 'tab-1',
          workflowId: 'workflow-1',
          tabName: 'Test',
          tabIsUnsaved: false,
        }
        expect(isValidWorkflowBuilderProps(props)).toBe(true)
      })

      it('should reject invalid props', () => {
        expect(isValidWorkflowBuilderProps({})).toBe(false)
        expect(isValidWorkflowBuilderProps(null)).toBe(false)
      })
    })

    it('should execute all validation functions from module', () => {
      // Ensure all runtime functions are accessible from the module
      expect(workflowBuilderModule.hasWorkflowBuilderCoreProps).toBeDefined()
      expect(workflowBuilderModule.hasWorkflowBuilderExecutionProps).toBeDefined()
      expect(workflowBuilderModule.hasWorkflowBuilderPersistenceProps).toBeDefined()
      expect(workflowBuilderModule.hasWorkflowBuilderDependencyProps).toBeDefined()
      expect(workflowBuilderModule.isValidWorkflowBuilderProps).toBeDefined()
    })

    it('should execute module via require', () => {
      // Force execution of the module to ensure coverage
      const requiredModule = require('./workflowBuilder')
      expect(requiredModule.hasWorkflowBuilderCoreProps).toBeDefined()
      expect(requiredModule.hasWorkflowBuilderExecutionProps).toBeDefined()
      expect(requiredModule.hasWorkflowBuilderPersistenceProps).toBeDefined()
      expect(requiredModule.hasWorkflowBuilderDependencyProps).toBeDefined()
      expect(requiredModule.isValidWorkflowBuilderProps).toBeDefined()
    })
  })
})
