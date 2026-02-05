/**
 * Official Agent Seeding Hook
 * Seeds official agents from official workflows (one-time operation)
 */

import { useEffect } from 'react'
import { logger } from '../../utils/logger'
import { setLocalStorageItem } from '../storage'
import { STORAGE_KEYS } from '../../config/constants'
import type { StorageAdapter, HttpClient } from '../../types/adapters'

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
      if (!storage) return

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
        if (!response.ok) {
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
            
            if (!workflowResponse.ok) {
              logger.error(`[Marketplace] Failed to fetch workflow ${workflow.id}: ${workflowResponse.statusText}`)
              continue
            }
            
            const workflowDetail = await workflowResponse.json()
            logger.debug(`[Marketplace] Workflow ${workflow.name} has ${workflowDetail.nodes?.length || 0} nodes`)
            
            // Extract agent nodes from workflow nodes
            if (workflowDetail.nodes && Array.isArray(workflowDetail.nodes)) {
              const agentNodes = workflowDetail.nodes.filter((node: any) => {
                const nodeType = node.type || node.data?.type
                const hasAgentConfig = node.agent_config || node.data?.agent_config
                const isAgent = nodeType === 'agent' && hasAgentConfig
                if (isAgent) {
                  logger.debug(`[Marketplace] Found agent node: ${node.id || node.data?.id}`, {
                    type: nodeType,
                    hasConfig: !!hasAgentConfig,
                    name: node.name || node.data?.name
                  })
                }
                return isAgent
              })

              logger.debug(`[Marketplace] Found ${agentNodes.length} agent nodes in workflow ${workflow.name}`)

              for (const agentNode of agentNodes) {
                // Create unique agent ID based on workflow and node
                const nodeId = agentNode.id || agentNode.data?.id || `node_${Date.now()}`
                const agentId = `official_${workflow.id}_${nodeId}`
                
                // Check if agent already exists
                if (!storage) continue
                const existingAgents = storage.getItem(STORAGE_KEYS.PUBLISHED_AGENTS)
                const agents: AgentTemplate[] = existingAgents ? JSON.parse(existingAgents) : []
                if (agents.some(a => a.id === agentId)) {
                  logger.debug(`[Marketplace] Agent ${agentId} already exists, skipping`)
                  continue // Skip if already exists
                }

                const agentConfig = agentNode.agent_config || agentNode.data?.agent_config || {}
                const nodeName = agentNode.name || agentNode.data?.name || agentNode.data?.label || 'Agent'
                const nodeDescription = agentNode.description || agentNode.data?.description || `Agent from ${workflow.name}`

                logger.debug(`[Marketplace] Creating official agent: ${nodeName} (${agentId})`)

                agentsToAdd.push({
                  id: agentId,
                  name: nodeName,
                  label: nodeName,
                  description: nodeDescription,
                  category: workflow.category || 'automation',
                  tags: [...(workflow.tags || []), 'official', workflow.name.toLowerCase().replace(/\s+/g, '-')],
                  difficulty: workflow.difficulty || 'intermediate',
                  estimated_time: workflow.estimated_time || '5 min',
                  agent_config: agentConfig,
                  published_at: (workflow as any).created_at || new Date().toISOString(),
                  author_id: workflow.author_id || null,
                  author_name: workflow.author_name || 'System',
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
        if (agentsToAdd.length > 0 && storage) {
          const existingAgents = storage.getItem(STORAGE_KEYS.PUBLISHED_AGENTS)
          const agents: AgentTemplate[] = existingAgents ? JSON.parse(existingAgents) : []
          agents.push(...agentsToAdd)
          storage.setItem(STORAGE_KEYS.PUBLISHED_AGENTS, JSON.stringify(agents))
          logger.debug(`[Marketplace] Seeded ${agentsToAdd.length} official agents from workflows`)
          logger.debug(`[Marketplace] Total agents in storage: ${agents.length}`)
          
          // Notify parent that agents were seeded
          if (onAgentsSeeded) {
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
