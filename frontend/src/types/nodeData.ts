/**
 * Type definitions for node data structures
 * Replaces 'any' types throughout the codebase
 */

import { Node } from '@xyflow/react'

export interface AgentConfig {
  model?: string
  system_prompt?: string
  max_tokens?: number
  temperature?: number
}

export interface ConditionConfig {
  condition_type?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 
                   'greater_than' | 'not_greater_than' | 'less_than' | 
                   'not_less_than' | 'empty' | 'not_empty' | 'custom'
  field?: string
  value?: string
}

export interface LoopConfig {
  loop_type?: 'for_each' | 'while' | 'until'
  max_iterations?: number
  items_source?: string
  condition?: string
}

export interface InputMapping {
  name: string
  source_node?: string
  source_field?: string
}

export interface InputConfig {
  mode?: 'read' | 'write'
  bucket_name?: string
  object_path?: string
  object_key?: string
  credentials?: string
  access_key_id?: string
  secret_access_key?: string
  region?: string
  project_id?: string
  topic_name?: string
  subscription_name?: string
  file_path?: string
  file_pattern?: string
  overwrite?: boolean
  // Database-specific fields
  database_type?: string
  connection_string?: string
  host?: string
  port?: number
  database_name?: string
  username?: string
  password?: string
  query?: string
  ssl_mode?: string
  // Firebase-specific fields
  firebase_service?: string
  collection_path?: string
  query_filter?: string
  // BigQuery-specific fields
  dataset?: string
  table?: string
  write_disposition?: string
  location?: string
  // Local filesystem-specific fields
  encoding?: string
  inputs?: Array<{
    name: string
    type?: string
    required?: boolean
    placeholder?: string
    description?: string
    default_value?: string | number
  }>
}

export interface NodeData {
  name?: string
  label?: string
  description?: string
  agent_config?: AgentConfig
  condition_config?: ConditionConfig
  loop_config?: LoopConfig
  input_config?: InputConfig
  inputs?: InputMapping[]
  executionStatus?: 'running' | 'completed' | 'failed' | 'pending'
}

export type NodeWithData = Node<NodeData & Record<string, unknown>>

// Type guards
export function isAgentNode(node: NodeWithData | null): node is NodeWithData & { type: 'agent' } {
  return node?.type === 'agent'
}

export function isConditionNode(node: NodeWithData | null): node is NodeWithData & { type: 'condition' } {
  return node?.type === 'condition'
}

export function isLoopNode(node: NodeWithData | null): node is NodeWithData & { type: 'loop' } {
  return node?.type === 'loop'
}

export function isInputNode(node: NodeWithData | null): node is NodeWithData & { 
  type: 'gcp_bucket' | 'aws_s3' | 'gcp_pubsub' | 'local_filesystem' | 'database' | 'firebase' | 'bigquery'
} {
  return node !== null && [
    'gcp_bucket', 
    'aws_s3', 
    'gcp_pubsub', 
    'local_filesystem', 
    'database', 
    'firebase', 
    'bigquery'
  ].includes(node.type || '')
}

export function isStartNode(node: NodeWithData | null): node is NodeWithData & { type: 'start' } {
  return node?.type === 'start'
}

export function isEndNode(node: NodeWithData | null): node is NodeWithData & { type: 'end' } {
  return node?.type === 'end'
}

