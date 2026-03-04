/**
 * Tool-to-Node Conversion Utilities
 * Single Responsibility: Only handles tool-to-node conversion
 */

import type { Node, XYPosition } from '@xyflow/react'
import { TOOL_NODE } from './marketplaceConstants'

export interface ToolTemplate {
  name?: string | null
  label?: string | null
  description?: string | null
  tool_config?: { tool_name: string } | null
}

function isNonEmptyString(value: string | null | undefined): value is string {
  return value != null && value !== ''
}

function getToolLabel(tool: ToolTemplate): string {
  if (isNonEmptyString(tool.name)) return tool.name
  if (isNonEmptyString(tool.label)) return tool.label
  return TOOL_NODE.DEFAULT_LABEL
}

function getToolDescription(tool: ToolTemplate): string {
  return isNonEmptyString(tool.description) ? tool.description : ''
}

function getToolConfig(tool: ToolTemplate): { tool_name: string } {
  if (tool.tool_config && typeof tool.tool_config.tool_name === 'string') {
    return tool.tool_config
  }
  return { tool_name: 'calculator' }
}

export function convertToolToNode(
  tool: ToolTemplate,
  position: XYPosition,
  index: number
): Node {
  const nodeId = `tool-${Date.now()}-${index}`
  return {
    id: nodeId,
    type: TOOL_NODE.TYPE,
    position,
    draggable: true,
    data: {
      label: getToolLabel(tool),
      name: getToolLabel(tool),
      description: getToolDescription(tool),
      tool_config: getToolConfig(tool),
      inputs: [],
    },
  }
}

export function convertToolsToNodes(
  tools: ToolTemplate[],
  positions: XYPosition[]
): Node[] {
  return tools.map((tool, index) => convertToolToNode(tool, positions[index], index))
}
