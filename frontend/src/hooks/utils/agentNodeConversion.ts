/**
 * Agent-to-Node Conversion Utilities
 * Extracted conversion logic to improve mutation resistance and DRY compliance
 * Single Responsibility: Only handles agent-to-node conversion
 */

import type { Node, Position } from '@xyflow/react'
import { AGENT_NODE } from './marketplaceConstants'
import { EMPTY_STRING } from './inputDefaults'

/**
 * Agent template interface
 */
export interface AgentTemplate {
  name?: string | null
  label?: string | null
  description?: string | null
  agent_config?: Record<string, any> | null | undefined
}

/**
 * Check if string value is non-empty
 * Mutation-resistant: explicit null/undefined/empty checks
 */
function isNonEmptyString(value: string | null | undefined): value is string {
  if (value === null || value === undefined) {
    return false
  }
  if (value === '') {
    return false
  }
  return true
}

/**
 * Get agent name or label with fallback chain
 * DRY: Shared logic for both name and label extraction
 * Mutation-resistant: explicit null/undefined/empty checks
 */
function getAgentNameOrLabel(agent: AgentTemplate): string {
  // Explicit checks to prevent mutation survivors
  if (isNonEmptyString(agent.name)) {
    return agent.name
  }

  if (isNonEmptyString(agent.label)) {
    return agent.label
  }

  return AGENT_NODE.DEFAULT_LABEL
}

/**
 * Get agent label with fallback chain
 * Mutation-resistant: explicit null/undefined/empty checks
 */
export function getAgentLabel(agent: AgentTemplate): string {
  return getAgentNameOrLabel(agent)
}

/**
 * Get agent name with fallback chain
 * Mutation-resistant: explicit null/undefined/empty checks
 */
export function getAgentName(agent: AgentTemplate): string {
  return getAgentNameOrLabel(agent)
}

/**
 * Get agent description with fallback
 * Mutation-resistant: explicit null/undefined/empty checks
 */
export function getAgentDescription(agent: AgentTemplate): string {
  if (isNonEmptyString(agent.description)) {
    return agent.description
  }

  return EMPTY_STRING
}

/**
 * Get agent config with fallback
 * Mutation-resistant: explicit null/undefined checks
 */
export function getAgentConfig(agent: AgentTemplate): Record<string, any> {
  if (agent.agent_config !== null && 
      agent.agent_config !== undefined) {
    return agent.agent_config
  }

  return {}
}

/**
 * Convert agent to node
 * Single Responsibility: Only handles conversion
 */
export function convertAgentToNode(
  agent: AgentTemplate,
  position: Position,
  index: number
): Node {
  const nodeId = `agent-${Date.now()}-${index}`
  
  return {
    id: nodeId,
    type: AGENT_NODE.TYPE,
    position,
    draggable: true,
    data: {
      label: getAgentLabel(agent),
      name: getAgentName(agent),
      description: getAgentDescription(agent),
      agent_config: getAgentConfig(agent),
    },
  }
}

/**
 * Convert multiple agents to nodes
 * DRY: Reusable conversion for multiple agents
 */
export function convertAgentsToNodes(
  agents: AgentTemplate[],
  positions: Position[]
): Node[] {
  return agents.map((agent, index) => {
    return convertAgentToNode(agent, positions[index], index)
  })
}
