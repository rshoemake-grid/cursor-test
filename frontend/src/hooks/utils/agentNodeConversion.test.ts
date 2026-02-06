/**
 * Agent Node Conversion Tests
 * Tests for agent-to-node conversion utilities to ensure mutation resistance
 */

import {
  getAgentLabel,
  getAgentName,
  getAgentDescription,
  getAgentConfig,
  convertAgentToNode,
  convertAgentsToNodes,
  type AgentTemplate
} from './agentNodeConversion'
import { AGENT_NODE } from './marketplaceConstants'

describe('agentNodeConversion', () => {
  describe('getAgentLabel', () => {
    it('should return name when name exists', () => {
      const agent: AgentTemplate = { name: 'Test Agent' }
      expect(getAgentLabel(agent)).toBe('Test Agent')
    })

    it('should return label when name is null but label exists', () => {
      const agent: AgentTemplate = { name: null, label: 'Test Label' }
      expect(getAgentLabel(agent)).toBe('Test Label')
    })

    it('should return label when name is undefined but label exists', () => {
      const agent: AgentTemplate = { name: undefined, label: 'Test Label' }
      expect(getAgentLabel(agent)).toBe('Test Label')
    })

    it('should return label when name is empty string but label exists', () => {
      const agent: AgentTemplate = { name: '', label: 'Test Label' }
      expect(getAgentLabel(agent)).toBe('Test Label')
    })

    it('should return default label when both name and label are null', () => {
      const agent: AgentTemplate = { name: null, label: null }
      expect(getAgentLabel(agent)).toBe(AGENT_NODE.DEFAULT_LABEL)
    })

    it('should return default label when both name and label are undefined', () => {
      const agent: AgentTemplate = { name: undefined, label: undefined }
      expect(getAgentLabel(agent)).toBe(AGENT_NODE.DEFAULT_LABEL)
    })

    it('should return default label when both name and label are empty strings', () => {
      const agent: AgentTemplate = { name: '', label: '' }
      expect(getAgentLabel(agent)).toBe(AGENT_NODE.DEFAULT_LABEL)
    })

    it('should prioritize name over label', () => {
      const agent: AgentTemplate = { name: 'Name', label: 'Label' }
      expect(getAgentLabel(agent)).toBe('Name')
    })
  })

  describe('getAgentName', () => {
    it('should return name when name exists', () => {
      const agent: AgentTemplate = { name: 'Test Agent' }
      expect(getAgentName(agent)).toBe('Test Agent')
    })

    it('should return label when name is null but label exists', () => {
      const agent: AgentTemplate = { name: null, label: 'Test Label' }
      expect(getAgentName(agent)).toBe('Test Label')
    })

    it('should return default label when both are missing', () => {
      const agent: AgentTemplate = {}
      expect(getAgentName(agent)).toBe(AGENT_NODE.DEFAULT_LABEL)
    })
  })

  describe('getAgentDescription', () => {
    it('should return description when it exists', () => {
      const agent: AgentTemplate = { description: 'Test Description' }
      expect(getAgentDescription(agent)).toBe('Test Description')
    })

    it('should return empty string when description is null', () => {
      const agent: AgentTemplate = { description: null }
      expect(getAgentDescription(agent)).toBe('')
    })

    it('should return empty string when description is undefined', () => {
      const agent: AgentTemplate = { description: undefined }
      expect(getAgentDescription(agent)).toBe('')
    })

    it('should return empty string when description is empty string', () => {
      const agent: AgentTemplate = { description: '' }
      expect(getAgentDescription(agent)).toBe('')
    })
  })

  describe('getAgentConfig', () => {
    it('should return config when it exists', () => {
      const config = { key: 'value' }
      const agent: AgentTemplate = { agent_config: config }
      expect(getAgentConfig(agent)).toBe(config)
    })

    it('should return empty object when config is null', () => {
      const agent: AgentTemplate = { agent_config: null }
      expect(getAgentConfig(agent)).toEqual({})
    })

    it('should return empty object when config is undefined', () => {
      const agent: AgentTemplate = { agent_config: undefined }
      expect(getAgentConfig(agent)).toEqual({})
    })

    it('should return empty object when config is missing', () => {
      const agent: AgentTemplate = {}
      expect(getAgentConfig(agent)).toEqual({})
    })
  })

  describe('convertAgentToNode', () => {
    it('should convert agent to node with correct structure', () => {
      const agent: AgentTemplate = {
        name: 'Test Agent',
        description: 'Test Description',
        agent_config: { key: 'value' }
      }
      const position = { x: 100, y: 200 }
      const node = convertAgentToNode(agent, position, 0)

      expect(node.id).toMatch(/^agent-\d+-0$/)
      expect(node.type).toBe(AGENT_NODE.TYPE)
      expect(node.position).toEqual(position)
      expect(node.draggable).toBe(true)
      expect(node.data.label).toBe('Test Agent')
      expect(node.data.name).toBe('Test Agent')
      expect(node.data.description).toBe('Test Description')
      expect(node.data.agent_config).toEqual({ key: 'value' })
    })

    it('should use fallback values when agent properties are missing', () => {
      const agent: AgentTemplate = {}
      const position = { x: 0, y: 0 }
      const node = convertAgentToNode(agent, position, 1)

      expect(node.data.label).toBe(AGENT_NODE.DEFAULT_LABEL)
      expect(node.data.name).toBe(AGENT_NODE.DEFAULT_LABEL)
      expect(node.data.description).toBe('')
      expect(node.data.agent_config).toEqual({})
    })
  })

  describe('convertAgentsToNodes', () => {
    it('should convert multiple agents to nodes', () => {
      const agents: AgentTemplate[] = [
        { name: 'Agent 1' },
        { name: 'Agent 2' },
        { name: 'Agent 3' }
      ]
      const positions = [
        { x: 0, y: 0 },
        { x: 0, y: 150 },
        { x: 0, y: 300 }
      ]

      const nodes = convertAgentsToNodes(agents, positions)

      expect(nodes).toHaveLength(3)
      expect(nodes[0].data.name).toBe('Agent 1')
      expect(nodes[1].data.name).toBe('Agent 2')
      expect(nodes[2].data.name).toBe('Agent 3')
      expect(nodes[0].position).toEqual(positions[0])
      expect(nodes[1].position).toEqual(positions[1])
      expect(nodes[2].position).toEqual(positions[2])
    })

    it('should handle empty agents array', () => {
      const nodes = convertAgentsToNodes([], [])
      expect(nodes).toHaveLength(0)
    })
  })
})
