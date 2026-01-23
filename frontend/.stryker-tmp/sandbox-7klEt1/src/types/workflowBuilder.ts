/**
 * Split WorkflowBuilder props into smaller, focused interfaces
 * Follows Interface Segregation Principle - clients only depend on what they need
 */
// @ts-nocheck


export interface WorkflowBuilderCoreProps {
  tabId: string;
  workflowId: string | null;
  tabName: string;
  tabIsUnsaved?: boolean;
}
export interface WorkflowBuilderExecutionProps {
  onExecutionStart?: (id: string) => void;
  onExecutionLogUpdate?: (workflowId: string, executionId: string, log: any) => void;
  onExecutionStatusUpdate?: (workflowId: string, executionId: string, status: 'running' | 'completed' | 'failed') => void;
  onExecutionNodeUpdate?: (workflowId: string, executionId: string, nodeId: string, nodeState: any) => void;
}
export interface WorkflowBuilderPersistenceProps {
  onWorkflowSaved?: (id: string, name: string) => void;
  onWorkflowModified?: () => void;
}
export interface WorkflowBuilderSelectionProps {
  onNodeSelected?: (nodeId: string | null) => void;
}
export type WorkflowBuilderProps = WorkflowBuilderCoreProps & Partial<WorkflowBuilderExecutionProps> & Partial<WorkflowBuilderPersistenceProps> & Partial<WorkflowBuilderSelectionProps>;