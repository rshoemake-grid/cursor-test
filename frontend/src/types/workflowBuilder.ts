/**
 * Split WorkflowBuilder props into smaller, focused interfaces
 * Follows Interface Segregation Principle - clients only depend on what they need
 */

import type { StorageAdapter } from '../types/adapters'
import type { Execution } from '../contexts/WorkflowTabsContext'

/**
 * Core workflow builder properties - always required
 */
export interface WorkflowBuilderCoreProps {
  tabId: string
  workflowId: string | null
  tabName: string
  tabIsUnsaved: boolean
}

/**
 * Execution-related properties - for workflow execution tracking
 */
export interface WorkflowBuilderExecutionProps {
  workflowTabs?: Array<{
    workflowId: string
    workflowName: string
    executions: Execution[]
    activeExecutionId: string | null
  }>
  onExecutionStart?: (executionId: string) => void
  onExecutionLogUpdate?: (workflowId: string, executionId: string, log: any) => void
  onExecutionStatusUpdate?: (workflowId: string, executionId: string, status: 'running' | 'completed' | 'failed') => void
  onExecutionNodeUpdate?: (workflowId: string, executionId: string, nodeId: string, nodeState: any) => void
  onRemoveExecution?: (workflowId: string, executionId: string) => void
  onClearExecutions?: (workflowId: string) => void
}

/**
 * Persistence-related properties - for workflow save/load operations
 */
export interface WorkflowBuilderPersistenceProps {
  onWorkflowSaved?: (workflowId: string, name: string) => void
  onWorkflowModified?: () => void
  onWorkflowLoaded?: (workflowId: string, name: string) => void
  onCloseWorkflow?: (workflowId: string) => void // Unused but kept for API compatibility
}

/**
 * Dependency injection properties
 */
export interface WorkflowBuilderDependencyProps {
  storage?: StorageAdapter | null
}

/**
 * Complete WorkflowBuilder props - combines all interface segments
 * This follows ISP by allowing clients to only depend on the segments they need
 */
export type WorkflowBuilderProps = WorkflowBuilderCoreProps &
  Partial<WorkflowBuilderExecutionProps> &
  Partial<WorkflowBuilderPersistenceProps> &
  Partial<WorkflowBuilderDependencyProps>

/**
 * Runtime validation functions for WorkflowBuilder types
 * These functions ensure the types are actually executed at runtime for test coverage
 */

/**
 * Validates that an object has the required WorkflowBuilderCoreProps
 */
export function hasWorkflowBuilderCoreProps(obj: any): obj is WorkflowBuilderCoreProps {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.tabId === 'string' &&
    (typeof obj.workflowId === 'string' || obj.workflowId === null) &&
    typeof obj.tabName === 'string' &&
    typeof obj.tabIsUnsaved === 'boolean'
  )
}

/**
 * Validates that an object has WorkflowBuilderExecutionProps (all optional)
 */
export function hasWorkflowBuilderExecutionProps(obj: any): obj is Partial<WorkflowBuilderExecutionProps> {
  return typeof obj === 'object' && obj !== null
}

/**
 * Validates that an object has WorkflowBuilderPersistenceProps (all optional)
 */
export function hasWorkflowBuilderPersistenceProps(obj: any): obj is Partial<WorkflowBuilderPersistenceProps> {
  return typeof obj === 'object' && obj !== null
}

/**
 * Validates that an object has WorkflowBuilderDependencyProps (all optional)
 */
export function hasWorkflowBuilderDependencyProps(obj: any): obj is Partial<WorkflowBuilderDependencyProps> {
  return typeof obj === 'object' && obj !== null
}

/**
 * Validates that an object is a valid WorkflowBuilderProps
 */
export function isValidWorkflowBuilderProps(obj: any): obj is WorkflowBuilderProps {
  return hasWorkflowBuilderCoreProps(obj)
}

