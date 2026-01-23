import { describe, it, expect } from 'vitest'
import { 
  isAgentNode, 
  isConditionNode, 
  isLoopNode, 
  isInputNode,
  isStartNode,
  isEndNode,
  type NodeWithData 
} from './nodeData'

describe('nodeData type guards', () => {
  const createMockNode = (type: string, data = {}) => ({
    id: 'test-node',
    type,
    data,
    position: { x: 0, y: 0 },
  }) as NodeWithData

  describe('isAgentNode', () => {
    it('should return true for agent nodes', () => {
      const node = createMockNode('agent')
      expect(isAgentNode(node)).toBe(true)
    })

    it('should return false for non-agent nodes', () => {
      const node = createMockNode('condition')
      expect(isAgentNode(node)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isAgentNode(null)).toBe(false)
    })
  })

  describe('isConditionNode', () => {
    it('should return true for condition nodes', () => {
      const node = createMockNode('condition')
      expect(isConditionNode(node)).toBe(true)
    })

    it('should return false for non-condition nodes', () => {
      const node = createMockNode('agent')
      expect(isConditionNode(node)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isConditionNode(null)).toBe(false)
    })
  })

  describe('isLoopNode', () => {
    it('should return true for loop nodes', () => {
      const node = createMockNode('loop')
      expect(isLoopNode(node)).toBe(true)
    })

    it('should return false for non-loop nodes', () => {
      const node = createMockNode('agent')
      expect(isLoopNode(node)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isLoopNode(null)).toBe(false)
    })
  })

  describe('isInputNode', () => {
    it('should return true for GCP bucket nodes', () => {
      const node = createMockNode('gcp_bucket')
      expect(isInputNode(node)).toBe(true)
    })

    it('should return true for AWS S3 nodes', () => {
      const node = createMockNode('aws_s3')
      expect(isInputNode(node)).toBe(true)
    })

    it('should return true for GCP Pub/Sub nodes', () => {
      const node = createMockNode('gcp_pubsub')
      expect(isInputNode(node)).toBe(true)
    })

    it('should return true for local filesystem nodes', () => {
      const node = createMockNode('local_filesystem')
      expect(isInputNode(node)).toBe(true)
    })

    it('should return true for database nodes', () => {
      const node = createMockNode('database')
      expect(isInputNode(node)).toBe(true)
    })

    it('should return true for firebase nodes', () => {
      const node = createMockNode('firebase')
      expect(isInputNode(node)).toBe(true)
    })

    it('should return true for bigquery nodes', () => {
      const node = createMockNode('bigquery')
      expect(isInputNode(node)).toBe(true)
    })

    it('should return false for non-input nodes', () => {
      const node = createMockNode('agent')
      expect(isInputNode(node)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isInputNode(null)).toBe(false)
    })
  })

  describe('isStartNode', () => {
    it('should return true for start nodes', () => {
      const node = createMockNode('start')
      expect(isStartNode(node)).toBe(true)
    })

    it('should return false for non-start nodes', () => {
      const node = createMockNode('agent')
      expect(isStartNode(node)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isStartNode(null)).toBe(false)
    })
  })

  describe('isEndNode', () => {
    it('should return true for end nodes', () => {
      const node = createMockNode('end')
      expect(isEndNode(node)).toBe(true)
    })

    it('should return false for non-end nodes', () => {
      const node = createMockNode('agent')
      expect(isEndNode(node)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isEndNode(null)).toBe(false)
    })
  })
})

