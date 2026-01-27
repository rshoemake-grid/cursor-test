import type { Node } from '@xyflow/react'
import type { WorkflowNode } from '../types/workflow'
import { logger } from '../utils/logger'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface NodeTypeHandler {
  /**
   * Render the editor UI for this node type
   */
  renderEditor: (node: Node, onChange: (updates: Partial<Node>) => void) => JSX.Element
  
  /**
   * Validate the node configuration
   */
  validate: (node: Node) => ValidationResult
  
  /**
   * Transform React Flow node to WorkflowNode format
   */
  transform: (node: Node) => WorkflowNode
  
  /**
   * Get default configuration for this node type
   */
  getDefaultConfig?: () => Partial<Node>
}

/**
 * Node Editor Registry
 * Follows Open/Closed Principle - open for extension, closed for modification
 * New node types can be added without modifying existing code
 */
class NodeEditorRegistry {
  private handlers: Map<string, NodeTypeHandler> = new Map()

  /**
   * Register a handler for a node type
   */
  register(nodeType: string, handler: NodeTypeHandler): void {
    if (this.handlers.has(nodeType)) {
      logger.warn(`Node type "${nodeType}" is already registered. Overwriting.`)
    }
    this.handlers.set(nodeType, handler)
  }

  /**
   * Get handler for a node type
   */
  getHandler(nodeType: string): NodeTypeHandler | undefined {
    return this.handlers.get(nodeType)
  }

  /**
   * Check if a node type is registered
   */
  hasHandler(nodeType: string): boolean {
    return this.handlers.has(nodeType)
  }

  /**
   * Get all registered node types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys())
  }

  /**
   * Unregister a node type handler
   */
  unregister(nodeType: string): boolean {
    return this.handlers.delete(nodeType)
  }
}

// Export singleton instance
export const nodeEditorRegistry = new NodeEditorRegistry()

