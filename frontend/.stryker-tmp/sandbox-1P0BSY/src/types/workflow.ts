// @ts-nocheck
export type NodeType = 'agent' | 'condition' | 'loop' | 'start' | 'end';
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';
export interface AgentConfig {
  model: string;
  system_prompt?: string;
  temperature: number;
  max_tokens?: number;
  tools?: string[];
}
export interface InputMapping {
  name: string;
  source_node?: string;
  source_field: string;
}
export interface ConditionConfig {
  condition_type: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'custom';
  field: string;
  value: string;
  true_branch?: string;
  false_branch?: string;
}
export interface LoopConfig {
  loop_type: 'for_each' | 'while' | 'until';
  items_source?: string;
  condition?: string;
  max_iterations?: number;
}
export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  description?: string;
  agent_config?: AgentConfig;
  condition_config?: ConditionConfig;
  loop_config?: LoopConfig;
  inputs: InputMapping[];
  position: {
    x: number;
    y: number;
  };
}
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: 'true' | 'false' | 'default';
  sourceHandle?: string | null;
  targetHandle?: string | null;
  source_handle?: string | null; // Backend might use snake_case
  target_handle?: string | null; // Backend might use snake_case
}
export interface WorkflowDefinition {
  id?: string;
  name: string;
  description?: string;
  version?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}
export interface NodeState {
  node_id: string;
  status: ExecutionStatus;
  input?: Record<string, any>;
  output?: any;
  error?: string;
  started_at?: string;
  completed_at?: string;
}
export interface ExecutionLogEntry {
  timestamp: string;
  level: string;
  node_id?: string;
  message: string;
}
export interface ExecutionState {
  execution_id: string;
  workflow_id: string;
  status: ExecutionStatus;
  current_node?: string;
  node_states: Record<string, NodeState>;
  variables: Record<string, any>;
  result?: any;
  error?: string;
  started_at: string;
  completed_at?: string;
  logs: ExecutionLogEntry[];
}