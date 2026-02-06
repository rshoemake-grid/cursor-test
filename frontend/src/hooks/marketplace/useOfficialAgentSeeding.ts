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
        logger.debug('[Marketplace] Official agents already seeded, skipping')
        return // Already seeded
      }

      logger.debug('[Marketplace] Starting to seed official agents...')
      try {
        // Fetch all official workflows
        const response = await httpClient.get(`${apiBaseUrl}/templates/?sort_by=popular`)
        // Explicit check to prevent mutation survivors
        if (response.ok !== true) {
          logger.error('[Marketplace] Failed to fetch templates:', response.statusText)
          return
        }
        const workflows = await response.json() as Template[]
        logger.debug('[Marketplace] Fetched workflows:', workflows.length)
        const officialWorkflows = workflows.filter((w: Template) => w.is_official)
        logger.debug('[Marketplace] Official workflows found:', officialWorkflows.length)

        if (officialWorkflows.length === 0) {
          logger.debug('[Marketplace] No official workflows found, marking as seeded')
          setLocalStorageItem(seededKey, 'true')
          return
        }

        // Fetch workflow details using the /use endpoint to get nodes
        // Note: This creates a temporary workflow but we only use it to extract agent nodes
        const agentsToAdd: AgentTemplate[] = []
        for (const workflow of officialWorkflows) {
          try {
            logger.debug(`[Marketplace] Processing workflow: ${workflow.name} (${workflow.id})`)
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
            const nodeCount = nullishCoalesce(workflowDetail.nodes?.length, 0)
            logger.debug(`[Marketplace] Workflow ${workflow.name} has ${nodeCount} nodes`)
            
            // Extract agent nodes from workflow nodes
            if (workflowDetail.nodes && Array.isArray(workflowDetail.nodes)) {
              const agentNodes = workflowDetail.nodes.filter((node: any) => {
                const nodeType = logicalOr(node.type, node.data?.type)
                const hasAgentConfig = logicalOr(node.agent_config, node.data?.agent_config)
                const isAgent = nodeType === 'agent' && hasAgentConfig
                if (isAgent) {
                  logger.debug(`[Marketplace] Found agent node: ${logicalOr(node.id, node.data?.id)}`, {
                    type: nodeType,
                    hasConfig: !!hasAgentConfig,
                    name: logicalOr(node.name, node.data?.name)
                  })
                }
                return isAgent
              })

              logger.debug(`[Marketplace] Found ${agentNodes.length} agent nodes in workflow ${workflow.name}`)

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
                  logger.debug(`[Marketplace] Agent ${agentId} already exists, skipping`)
                  continue // Skip if already exists
                }

                const agentConfig = logicalOrToEmptyObject(logicalOr(agentNode.agent_config, agentNode.data?.agent_config))
                const nodeName = logicalOr(agentNode.name, logicalOr(agentNode.data?.name, logicalOr(agentNode.data?.label, 'Agent')))
                const nodeDescription = logicalOr(agentNode.description, logicalOr(agentNode.data?.description, `Agent from ${workflow.name}`))

                logger.debug(`[Marketplace] Creating official agent: ${nodeName} (${agentId})`)

                agentsToAdd.push({
                  id: agentId,
                  name: nodeName,
                  label: nodeName,
                  description: nodeDescription,
                  category: logicalOr(workflow.category, 'automation'),
                  tags: [...logicalOrToEmptyArray(workflow.tags), 'official', workflow.name.toLowerCase().replace(/\s+/g, '-')],
                  difficulty: logicalOr(workflow.difficulty, 'intermediate'),
                  estimated_time: logicalOr(workflow.estimated_time, '5 min'),
                  agent_config: agentConfig,
                  published_at: logicalOr((workflow as any).created_at, new Date().toISOString()),
                  author_id: logicalOr(workflow.author_id, null),
                  author_name: logicalOr(workflow.author_name, 'System'),
                  is_official: true
                })
              }
            } else {
              logger.debug(`[Marketplace] Workflow ${workflow.name} has no nodes array`)
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
          logger.debug(`[Marketplace] Seeded ${agentsToAdd.length} official agents from workflows`)
          logger.debug(`[Marketplace] Total agents in storage: ${agents.length}`)
          
          // Notify parent that agents were seeded
          // Explicit check to prevent mutation survivors
          if (onAgentsSeeded !== null && onAgentsSeeded !== undefined) {
            onAgentsSeeded()
          }
        } else {
          logger.debug('[Marketplace] No agents to add')
        }

        setLocalStorageItem(seededKey, 'true')
        logger.debug('[Marketplace] Seeding complete')
      } catch (error) {
        logger.error('[Marketplace] Failed to seed official agents:', error)
      }
    }

    seedOfficialAgents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storage, httpClient, apiBaseUrl]) // Run once on mount
}
