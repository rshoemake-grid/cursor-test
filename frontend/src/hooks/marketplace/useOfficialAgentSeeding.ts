/**
 * Official Agent Seeding Hook
 * Seeds official agents from official workflows (one-time operation)
 */

import { useEffect } from 'react'
import { logger } from '../../utils/logger'
import { setLocalStorageItem } from '../storage'
import { STORAGE_KEYS } from '../../config/constants'
import type { StorageAdapter, HttpClient } from '../../types/adapters'
import { logicalOr, logicalOrToEmptyObject, logicalOrToEmptyArray } from '../utils/logicalOr'
import { nullishCoalesce } from '../utils/nullishCoalescing'

interface Template {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  difficulty: string
  estimated_time: string
  is_official: boolean
  uses_count: number
  likes_count: number
  rating: number
  author_id?: string | null
  author_name?: string | null
}

interface AgentTemplate {
  id: string
  name: string
  label: string
  description: string
  category: string
  tags: string[]
  difficulty: string
  estimated_time: string
  agent_config: any
  published_at?: string
  author_id?: string | null
  author_name?: string | null
  is_official?: boolean
}

interface UseOfficialAgentSeedingOptions {
  storage: StorageAdapter | null
  httpClient: HttpClient
  apiBaseUrl: string
  onAgentsSeeded?: () => void
}

/**
 * Hook for seeding official agents from official workflows
 * 
 * @param options Configuration options
 */
export function useOfficialAgentSeeding({
  storage,
  httpClient,
  apiBaseUrl,
  onAgentsSeeded,
}: UseOfficialAgentSeedingOptions) {
  useEffect(() => {
    const seedOfficialAgents = async () => {
      // Explicit null/undefined check to prevent mutation survivors
      if (storage === null || storage === undefined) return

      const seededKey = 'officialAgentsSeeded'
      // Clear the flag to force re-seeding (remove this line after first successful seed)
      try {
        storage.removeItem(seededKey)
      } catch (error) {
        logger.error('Failed to remove seeded key:', error)
      }
      
      let seeded = false
      try {
        seeded = !!storage.getItem(seededKey)
      } catch (error) {
        logger.error('Failed to check seeded key:', error)
      }
      
      if (seeded) {
        return // Already seeded
      }

      try {
        // Fetch all official workflows
        const response = await httpClient.get(`${apiBaseUrl}/templates/?sort_by=popular`)
        // Explicit check to prevent mutation survivors
        if (response.ok !== true) {
          logger.error('[Marketplace] Failed to fetch templates:', response.statusText)
          return
        }
        const workflows = await response.json() as Template[]
        const officialWorkflows = workflows.filter((w: Template) => w.is_official)

        if (officialWorkflows.length === 0) {
          setLocalStorageItem(seededKey, 'true')
          return
        }

        // Fetch workflow details using the /use endpoint to get nodes
        // Note: This creates a temporary workflow but we only use it to extract agent nodes
        const agentsToAdd: AgentTemplate[] = []
        for (const workflow of officialWorkflows) {
          try {
            // Use the /use endpoint to get the full workflow with nodes
            const workflowResponse = await httpClient.post(
              `${apiBaseUrl}/templates/${workflow.id}/use`,
              {},
              { 'Content-Type': 'application/json' }
            )
            
            // Explicit check to prevent mutation survivors
            if (workflowResponse.ok !== true) {
              logger.error(`[Marketplace] Failed to fetch workflow ${workflow.id}: ${workflowResponse.statusText}`)
              continue
            }
            
            const workflowDetail = await workflowResponse.json()
            
            // Extract agent nodes from workflow nodes
            if (workflowDetail.nodes && Array.isArray(workflowDetail.nodes)) {
              const agentNodes = workflowDetail.nodes.filter((node: any) => {
                const nodeType = logicalOr(node.type, node.data?.type)
                const hasAgentConfig = logicalOr(node.agent_config, node.data?.agent_config)
                const isAgent = nodeType === 'agent' && hasAgentConfig
                return isAgent
              })

              for (const agentNode of agentNodes) {
                // Create unique agent ID based on workflow and node
                const nodeId = logicalOr(agentNode.id, logicalOr(agentNode.data?.id, `node_${Date.now()}`))
                const agentId = `official_${workflow.id}_${nodeId}`
                
                // Check if agent already exists
                // Explicit null/undefined check to prevent mutation survivors
                if (storage === null || storage === undefined) continue
                const existingAgents = storage.getItem(STORAGE_KEYS.PUBLISHED_AGENTS)
                const agents: AgentTemplate[] = existingAgents ? JSON.parse(existingAgents) : logicalOrToEmptyArray([])
                if (agents.some(a => a.id === agentId)) {
                  continue // Skip if already exists
                }

                const agentConfig = logicalOrToEmptyObject(logicalOr(agentNode.agent_config, agentNode.data?.agent_config))
                const nodeName = logicalOr(agentNode.name, logicalOr(agentNode.data?.name, logicalOr(agentNode.data?.label, 'Agent')))
                const nodeDescription = logicalOr(agentNode.description, logicalOr(agentNode.data?.description, `Agent from ${workflow.name}`))

                agentsToAdd.push({
                  id: agentId,
                  name: nodeName,
                  label: nodeName,
                  description: nodeDescription,
                  category: (() => {
                    const cat = logicalOr(workflow.category, 'automation')
                    return (cat !== null && cat !== undefined && typeof cat === 'string') ? cat : 'automation'
                  })(),
                  tags: [...logicalOrToEmptyArray(workflow.tags), 'official', (workflow.name || '').toLowerCase().replace(/\s+/g, '-')],
                  difficulty: (() => {
                    const diff = logicalOr(workflow.difficulty, 'intermediate')
                    return (diff !== null && diff !== undefined && typeof diff === 'string') ? diff : 'intermediate'
                  })(),
                  estimated_time: (() => {
                    const est = logicalOr(workflow.estimated_time, '5 min')
                    return (est !== null && est !== undefined && typeof est === 'string') ? est : '5 min'
                  })(),
                  agent_config: agentConfig,
                  published_at: logicalOr((workflow as any).created_at, new Date().toISOString()),
                  author_id: logicalOr(workflow.author_id, null),
                  author_name: logicalOr(workflow.author_name, 'System'),
                  is_official: true
                })
              }
            }
          } catch (error) {
            logger.error(`[Marketplace] Failed to fetch workflow ${workflow.id}:`, error)
          }
        }

        // Add official agents to storage
        // Explicit checks to prevent mutation survivors
        if (agentsToAdd.length > 0 && storage !== null && storage !== undefined) {
          const existingAgents = storage.getItem(STORAGE_KEYS.PUBLISHED_AGENTS)
          const agents: AgentTemplate[] = existingAgents ? JSON.parse(existingAgents) : logicalOrToEmptyArray([])
          agents.push(...agentsToAdd)
          storage.setItem(STORAGE_KEYS.PUBLISHED_AGENTS, JSON.stringify(agents))
          
          // Notify parent that agents were seeded
          // Explicit check to prevent mutation survivors
          if (onAgentsSeeded !== null && onAgentsSeeded !== undefined) {
            onAgentsSeeded()
          }
        }

        setLocalStorageItem(seededKey, 'true')
      } catch (error) {
        logger.error('[Marketplace] Failed to seed official agents:', error)
      }
    }

    seedOfficialAgents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storage, httpClient, apiBaseUrl]) // Run once on mount
}
