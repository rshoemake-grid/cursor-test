import axios, { type AxiosInstance } from 'axios'
import type { WorkflowDefinition, ExecutionState } from '../types/workflow'
import type { StorageAdapter } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'
import { logger } from '../utils/logger'

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

  return instance
}

// Default axios instance for backward compatibility
const axiosInstance = createAxiosInstance()

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
    const response = await instance.get('/workflows')
    return response.data
  },

  async getWorkflow(id: string): Promise<WorkflowDefinition> {
    const response = await instance.get(`/workflows/${id}`)
    return response.data
  },

  async createWorkflow(workflow: Omit<WorkflowDefinition, 'id'>): Promise<WorkflowDefinition> {
    const response = await instance.post('/workflows', workflow)
    return response.data
  },

  async updateWorkflow(id: string, workflow: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    const response = await instance.put(`/workflows/${id}`, workflow)
    return response.data
  },

  async deleteWorkflow(id: string): Promise<void> {
    await instance.delete(`/workflows/${id}`)
  },

  async bulkDeleteWorkflows(ids: string[]): Promise<{ message: string; deleted_count: number; failed_ids?: string[] }> {
    const response = await instance.post('/workflows/bulk-delete', {
      workflow_ids: ids
    })
    return response.data
  },

  async duplicateWorkflow(id: string): Promise<WorkflowDefinition> {
    // Get the workflow first - need to use the instance methods directly
    const getWorkflowResponse = await instance.get(`/workflows/${id}`)
    const workflow = getWorkflowResponse.data
    // Create a new workflow with "-copy" appended to the name
    const duplicated = {
      ...workflow,
      id: undefined, // Remove ID so it creates a new one
      name: `${workflow.name}-copy`,
    }
    const createResponse = await instance.post('/workflows', duplicated)
    return createResponse.data
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
    const response = await instance.post(`/workflows/${workflowId}/publish`, publishData)
    return response.data
  },

  // Templates
  async deleteTemplate(templateId: string): Promise<void> {
    await instance.delete(`/templates/${templateId}`)
  },

  // Executions
  async executeWorkflow(
    workflowId: string,
    inputs: Record<string, any> = {}
  ): Promise<ExecutionState> {
    injectedLogger.debug('[API Client] executeWorkflow called with:', { workflowId, inputs })
    try {
      const url = `/workflows/${workflowId}/execute`
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
      return response.data
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
    const response = await instance.get(`/executions/${executionId}`)
    return response.data
  },

  // Settings
  async getLLMSettings(): Promise<any> {
    try {
      const response = await instance.get('/settings/llm')
      return response.data
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

