export type NodeType = 'agent' | 'condition' | 'loop' | 'start' | 'end'

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused'

export interface ADKAgentConfig {
  name: string
  description?: string
  instruction?: string  // Maps to system_prompt
  sub_agents?: string[]  // List of sub-agent config paths or IDs
  adk_tools?: string[]  // ADK built-in tools (google_search, etc.)
  yaml_config?: string  // Raw YAML config if provided
}

export interface AgentConfig {
  agent_type?: 'workflow' | 'adk'  // Default: 'workflow'
  model: string
  system_prompt?: string
  temperature: number
  max_tokens?: number
  tools?: string[]
  adk_config?: ADKAgentConfig  // ADK-specific configuration
}

export interface InputMapping {
  name: string
  source_node?: string
  source_field: string
}

export interface ConditionConfig {
  condition_type: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'custom'
  field: string
  value: string
  true_branch?: string
  false_branch?: string
}

export interface LoopConfig {
  loop_type: 'for_each' | 'while' | 'until'
  items_source?: string
  condition?: string
  max_iterations?: number
}

export interface WorkflowNode {
  id: string
  type: NodeType
  name: string
  description?: string
  agent_config?: AgentConfig
  condition_config?: ConditionConfig
  loop_config?: LoopConfig
  inputs: InputMapping[]
  position: { x: number; y: number }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  label?: string
  condition?: 'true' | 'false' | 'default'
  sourceHandle?: string | null
  targetHandle?: string | null
  source_handle?: string | null  // Backend might use snake_case
  target_handle?: string | null   // Backend might use snake_case
}

export interface WorkflowDefinition {
  id?: string
  name: string
  description?: string
  version?: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  variables: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface NodeState {
  node_id: string
  status: ExecutionStatus
  input?: Record<string, any>
  output?: any
  error?: string
  started_at?: string
  completed_at?: string
}

export interface ExecutionLogEntry {
  timestamp: string
  level: string
  node_id?: string
  message: string
}

export interface ExecutionState {
  execution_id: string
  workflow_id: string
  status: ExecutionStatus
  current_node?: string
  node_states: Record<string, NodeState>
  variables: Record<string, any>
  result?: any
  error?: string
  started_at: string
  completed_at?: string
  logs: ExecutionLogEntry[]
}

/**
 * Runtime type validation functions for workflow types
 * These functions ensure the types are actually executed at runtime for test coverage
 */

const VALID_NODE_TYPES: NodeType[] = ['agent', 'condition', 'loop', 'start', 'end']
const VALID_EXECUTION_STATUSES: ExecutionStatus[] = ['pending', 'running', 'completed', 'failed', 'paused']
const VALID_CONDITION_TYPES = ['equals', 'contains', 'greater_than', 'less_than', 'custom'] as const
const VALID_LOOP_TYPES = ['for_each', 'while', 'until'] as const
const VALID_EDGE_CONDITIONS = ['true', 'false', 'default'] as const

/**
 * Type guard to validate NodeType
 */
export function isValidNodeType(value: string): value is NodeType {
  return VALID_NODE_TYPES.includes(value as NodeType)
}

/**
 * Type guard to validate ExecutionStatus
 */
export function isValidExecutionStatus(value: string): value is ExecutionStatus {
  return VALID_EXECUTION_STATUSES.includes(value as ExecutionStatus)
}

/**
 * Type guard to validate ConditionConfig condition_type
 */
export function isValidConditionType(value: string): boolean {
  return VALID_CONDITION_TYPES.includes(value as any)
}

/**
 * Type guard to validate LoopConfig loop_type
 */
export function isValidLoopType(value: string): boolean {
  return VALID_LOOP_TYPES.includes(value as any)
}

/**
 * Type guard to validate WorkflowEdge condition
 */
export function isValidEdgeCondition(value: string): boolean {
  return VALID_EDGE_CONDITIONS.includes(value as any)
}

