/**
 * Template Usage Hook
 * Handles using templates to create new workflows
 */

/**
 * Template Usage Hook
 * Handles using templates to create new workflows
 */

import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { logger as defaultLogger } from '../../utils/logger'
import { buildAuthHeaders } from '../utils/apiUtils'
import type { HttpClient } from '../../types/adapters'

interface UseTemplateUsageOptions {
  token: string | null
  httpClient: HttpClient
  apiBaseUrl: string
  logger?: typeof defaultLogger
}

/**
 * Hook for using templates
 * 
 * @param options Configuration options
 * @returns Template usage handler
 */
export function useTemplateUsage({
  token,
  httpClient,
  apiBaseUrl,
  logger = defaultLogger,
}: UseTemplateUsageOptions) {
  const navigate = useNavigate()

  const useTemplate = useCallback(async (templateId: string) => {
    try {
      const headers = buildAuthHeaders({ token })

      const response = await httpClient.post(
        `${apiBaseUrl}/templates/${templateId}/use`,
        {},
        headers
      )

      if (response.ok) {
        const workflow = await response.json()
        logger.debug('Created workflow from template:', workflow)
        // Navigate to builder with workflow ID and timestamp to ensure new tab is always created
        // The timestamp makes each navigation unique, even for the same workflow
        navigate(`/?workflow=${workflow.id}&_new=${Date.now()}`)
      } else {
        logger.error('Failed to use template:', await response.text())
      }
    } catch (error) {
      logger.error('Failed to use template:', error)
    }
  }, [token, httpClient, apiBaseUrl, navigate, logger])

  return { useTemplate }
}
