import axios, { type AxiosInstance } from 'axios'
import type { WorkflowDefinition, ExecutionState } from '../types/workflow'
import type { StorageAdapter } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'
import { logger } from '../utils/logger'
// DRY: Use extracted utilities
import { extractData } from './responseHandlers'
import { workflowEndpoints, templateEndpoints, executionEndpoints, marketplaceEndpoints, settingsEndpoints } from './endpoints'

const API_BASE_URL = '/api'

/**
 * Create axios instance with interceptor to add auth token
 */
function createAxiosInstance(
  baseURL: string = API_BASE_URL,
  options?: {
    localStorage?: StorageAdapter | null
    sessionStorage?: StorageAdapter | null
    axiosInstance?: AxiosInstance
  }
): AxiosInstance {
  const {
    localStorage: local = defaultAdapters.createLocalStorageAdapter(),
    sessionStorage: session = defaultAdapters.createSessionStorageAdapter(),
    axiosInstance: providedInstance
  } = options ?? {}

  const instance = providedInstance ?? axios.create({ baseURL })

  // Add request interceptor to include auth token
  instance.interceptors.request.use(
    (config) => {
      // Get token from storage (check localStorage first for "remember me", then sessionStorage)
      if (local && session) {
        const rememberMe = local.getItem('auth_remember_me') === 'true'
        const storage = rememberMe ? local : session
        const token = storage.getItem('auth_token')
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Add response interceptor to handle 401 errors globally
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle 401 Unauthorized errors
      if (error.response?.status === 401) {
        // Clear auth data from storage
        if (local && session) {
          local.removeItem('auth_token')
          local.removeItem('auth_user')
          local.removeItem('auth_remember_me')
          session.removeItem('auth_token')
          session.removeItem('auth_user')
        }
        
        // Dispatch a custom event that AuthContext can listen to
        // This allows components to react to authentication failures
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        }
      }
      
      return Promise.reject(error)
    }
  )

  return instance
}

// Default axios instance for backward compatibility (exported via api object)
// Note: createAxiosInstance() is called directly in createApiClient() below

/**
 * Create API client with dependency injection support
 */
export function createApiClient(options?: {
  baseURL?: string
  axiosInstance?: AxiosInstance
  localStorage?: StorageAdapter | null
  sessionStorage?: StorageAdapter | null
  logger?: typeof logger
}) {
  const {
    baseURL = API_BASE_URL,
    logger: injectedLogger = logger
  } = options ?? {}

  const instance = createAxiosInstance(baseURL, {
    localStorage: options?.localStorage,
    sessionStorage: options?.sessionStorage,
    axiosInstance: options?.axiosInstance
  })

  return {
  // Workflows
  async getWorkflows(): Promise<WorkflowDefinition[]> {
    return extractData(await instance.get(workflowEndpoints.list()))
  },

  async getWorkflow(id: string): Promise<WorkflowDefinition> {
    return extractData(await instance.get(workflowEndpoints.detail(id)))
  },

  async createWorkflow(workflow: Omit<WorkflowDefinition, 'id'>): Promise<WorkflowDefinition> {
    return extractData(await instance.post(workflowEndpoints.list(), workflow))
  },

  async updateWorkflow(id: string, workflow: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    return extractData(await instance.put(workflowEndpoints.detail(id), workflow))
  },

  async deleteWorkflow(id: string): Promise<void> {
    await instance.delete(workflowEndpoints.detail(id))
  },

  async bulkDeleteWorkflows(ids: string[]): Promise<{ message: string; deleted_count: number; failed_ids?: string[] }> {
    return extractData(await instance.post(workflowEndpoints.bulkDelete(), {
      workflow_ids: ids
    }))
  },

  async duplicateWorkflow(id: string): Promise<WorkflowDefinition> {
    // Get the workflow first
    const getResponse = await instance.get(workflowEndpoints.detail(id))
    const workflow = extractData(getResponse)
    // Create a new workflow with "-copy" appended to the name
    const duplicated = {
      ...workflow,
      id: undefined, // Remove ID so it creates a new one
      name: `${workflow.name}-copy`,
    }
    const postResponse = await instance.post(workflowEndpoints.list(), duplicated)
    return extractData(postResponse)
  },

  async publishWorkflow(
    workflowId: string,
    publishData: {
      category: string
      tags: string[]
      difficulty: string
      estimated_time?: string
    }
  ): Promise<any> {
    return extractData(await instance.post(workflowEndpoints.publish(workflowId), publishData))
  },

  async publishAgent(
    agentData: {
      name: string
      description: string
      category: string
      tags: string[]
      difficulty: string
      estimated_time?: string
      agent_config: any
    }
  ): Promise<any> {
    return extractData(await instance.post(marketplaceEndpoints.agents(), agentData))
  },

  // Templates
  async deleteTemplate(templateId: string): Promise<void> {
    await instance.delete(templateEndpoints.delete(templateId))
  },

  // Executions
  async executeWorkflow(
    workflowId: string,
    inputs: Record<string, any> = {}
  ): Promise<ExecutionState> {
    injectedLogger.debug('[API Client] executeWorkflow called with:', { workflowId, inputs })
    try {
      const url = workflowEndpoints.execute(workflowId)
      const payload = {
        workflow_id: workflowId,
        inputs,
      }
      injectedLogger.debug('[API Client] POST request to:', url)
      injectedLogger.debug('[API Client] Request payload:', payload)
      const response = await instance.post(url, payload)
      injectedLogger.debug('[API Client] Response received:', {
        status: response.status,
        data: response.data
      })
      return extractData(response)
    } catch (error: any) {
      injectedLogger.error('[API Client] executeWorkflow error:', error)
      injectedLogger.error('[API Client] Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      throw error
    }
  },

  async getExecution(executionId: string): Promise<ExecutionState> {
    return extractData(await instance.get(executionEndpoints.detail(executionId)))
  },

  async listExecutions(params?: {
    workflow_id?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<ExecutionState[]> {
    return extractData(await instance.get(executionEndpoints.list(), { params }))
  },

  // Settings
  async getLLMSettings(): Promise<any> {
    try {
      return extractData(await instance.get(settingsEndpoints.llm()))
    } catch (error: any) {
      // Return empty settings if not authenticated or error
      if (error.response?.status === 401) {
        return { providers: [] }
      }
      throw error
    }
  },
  }
}

// Default export for backward compatibility
export const api = createApiClient()

