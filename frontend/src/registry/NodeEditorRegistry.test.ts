import { nodeEditorRegistry, type NodeTypeHandler, type ValidationResult } from './NodeEditorRegistry'
import type { Node } from '@xyflow/react'
import type { WorkflowNode } from '../types/workflow'

describe('NodeEditorRegistry', () => {
  let mockHandler: NodeTypeHandler

  beforeEach(() => {
    // Clear registry before each test
    const registeredTypes = nodeEditorRegistry.getRegisteredTypes()
    registeredTypes.forEach(type => {
      nodeEditorRegistry.unregister(type)
    })

    mockHandler = {
      renderEditor: jest.fn((node: Node, onChange: (updates: Partial<Node>) => void) => 
        ({ type: 'div', props: { children: 'Editor' } } as any)
      ),
      validate: jest.fn((node: Node): ValidationResult => ({
        isValid: true,
        errors: [],
      })),
      transform: jest.fn((node: Node): WorkflowNode => ({
        id: node.id,
        type: node.type as any,
        name: node.data?.label || node.id,
        position: node.position,
        inputs: [],
      })),
      getDefaultConfig: jest.fn(() => ({ data: { label: 'Default' } })),
    }
  })

  describe('register', () => {
    it('should register a handler for a node type', () => {
      nodeEditorRegistry.register('test-node', mockHandler)

      expect(nodeEditorRegistry.hasHandler('test-node')).toBe(true)
      expect(nodeEditorRegistry.getHandler('test-node')).toBe(mockHandler)
    })

    it('should overwrite existing handler and warn', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      const anotherHandler = { ...mockHandler }

      nodeEditorRegistry.register('test-node', mockHandler)
      nodeEditorRegistry.register('test-node', anotherHandler)

      expect(consoleSpy).toHaveBeenCalledWith(
        '[WARN]',
        expect.stringContaining('Node type "test-node" is already registered. Overwriting.')
      )
      expect(nodeEditorRegistry.getHandler('test-node')).toBe(anotherHandler)

      consoleSpy.mockRestore()
    })
  })

  describe('getHandler', () => {
    it('should return handler for registered node type', () => {
      nodeEditorRegistry.register('test-node', mockHandler)

      const handler = nodeEditorRegistry.getHandler('test-node')

      expect(handler).toBe(mockHandler)
    })

    it('should return undefined for unregistered node type', () => {
      const handler = nodeEditorRegistry.getHandler('unregistered-node')

      expect(handler).toBeUndefined()
    })
  })

  describe('hasHandler', () => {
    it('should return true for registered node type', () => {
      nodeEditorRegistry.register('test-node', mockHandler)

      expect(nodeEditorRegistry.hasHandler('test-node')).toBe(true)
    })

    it('should return false for unregistered node type', () => {
      expect(nodeEditorRegistry.hasHandler('unregistered-node')).toBe(false)
    })
  })

  describe('getRegisteredTypes', () => {
    it('should return empty array when no handlers registered', () => {
      expect(nodeEditorRegistry.getRegisteredTypes()).toEqual([])
    })

    it('should return all registered node types', () => {
      nodeEditorRegistry.register('type1', mockHandler)
      nodeEditorRegistry.register('type2', mockHandler)
      nodeEditorRegistry.register('type3', mockHandler)

      const types = nodeEditorRegistry.getRegisteredTypes()

      expect(types).toContain('type1')
      expect(types).toContain('type2')
      expect(types).toContain('type3')
      expect(types).toHaveLength(3)
    })
  })

  describe('unregister', () => {
    it('should remove handler for registered node type', () => {
      nodeEditorRegistry.register('test-node', mockHandler)

      const result = nodeEditorRegistry.unregister('test-node')

      expect(result).toBe(true)
      expect(nodeEditorRegistry.hasHandler('test-node')).toBe(false)
    })

    it('should return false for unregistered node type', () => {
      const result = nodeEditorRegistry.unregister('unregistered-node')

      expect(result).toBe(false)
    })
  })

  describe('handler methods', () => {
    const testNode: Node = {
      id: 'node-1',
      type: 'start',
      position: { x: 0, y: 0 },
      data: { label: 'Test Node' },
    }

    it('should call renderEditor', () => {
      nodeEditorRegistry.register('test-node', mockHandler)
      const handler = nodeEditorRegistry.getHandler('test-node')!

      const onChange = jest.fn()
      handler.renderEditor(testNode, onChange)

      expect(mockHandler.renderEditor).toHaveBeenCalledWith(testNode, onChange)
    })

    it('should call validate', () => {
      nodeEditorRegistry.register('test-node', mockHandler)
      const handler = nodeEditorRegistry.getHandler('test-node')!

      const result = handler.validate(testNode)

      expect(mockHandler.validate).toHaveBeenCalledWith(testNode)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should call transform', () => {
      nodeEditorRegistry.register('test-node', mockHandler)
      const handler = nodeEditorRegistry.getHandler('test-node')!

      const result = handler.transform(testNode)

      expect(mockHandler.transform).toHaveBeenCalledWith(testNode)
      expect(result.id).toBe('node-1')
      expect(result.type).toBe('start')
    })

    it('should call getDefaultConfig if provided', () => {
      nodeEditorRegistry.register('test-node', mockHandler)
      const handler = nodeEditorRegistry.getHandler('test-node')!

      const config = handler.getDefaultConfig?.()

      expect(mockHandler.getDefaultConfig).toHaveBeenCalled()
      expect(config).toEqual({ data: { label: 'Default' } })
    })

    it('should handle handler without getDefaultConfig', () => {
      const handlerWithoutDefault: NodeTypeHandler = {
        renderEditor: mockHandler.renderEditor,
        validate: mockHandler.validate,
        transform: mockHandler.transform,
      }
      nodeEditorRegistry.register('test-node', handlerWithoutDefault)
      const handler = nodeEditorRegistry.getHandler('test-node')!

      const config = handler.getDefaultConfig?.()

      expect(config).toBeUndefined()
    })
  })
})
