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

