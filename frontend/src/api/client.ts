import axios from 'axios'
import type { WorkflowDefinition, ExecutionState } from '../types/workflow'

const API_BASE_URL = '/api'

// Create axios instance with interceptor to add auth token
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
})

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from storage (check localStorage first for "remember me", then sessionStorage)
    const rememberMe = localStorage.getItem('auth_remember_me') === 'true'
    const storage = rememberMe ? localStorage : sessionStorage
    const token = storage.getItem('auth_token')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const api = {
  // Workflows
  async getWorkflows(): Promise<WorkflowDefinition[]> {
    const response = await axiosInstance.get('/workflows')
    return response.data
  },

  async getWorkflow(id: string): Promise<WorkflowDefinition> {
    const response = await axiosInstance.get(`/workflows/${id}`)
    return response.data
  },

  async createWorkflow(workflow: Omit<WorkflowDefinition, 'id'>): Promise<WorkflowDefinition> {
    const response = await axiosInstance.post('/workflows', workflow)
    return response.data
  },

  async updateWorkflow(id: string, workflow: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    const response = await axiosInstance.put(`/workflows/${id}`, workflow)
    return response.data
  },

  async deleteWorkflow(id: string): Promise<void> {
    await axiosInstance.delete(`/workflows/${id}`)
  },

  async bulkDeleteWorkflows(ids: string[]): Promise<{ message: string; deleted_count: number; failed_ids?: string[] }> {
    const response = await axiosInstance.post('/workflows/bulk-delete', {
      workflow_ids: ids
    })
    return response.data
  },

  async duplicateWorkflow(id: string): Promise<WorkflowDefinition> {
    // Get the workflow first
    const workflow = await this.getWorkflow(id)
    // Create a new workflow with "-copy" appended to the name
    const duplicated = {
      ...workflow,
      id: undefined, // Remove ID so it creates a new one
      name: `${workflow.name}-copy`,
    }
    return await this.createWorkflow(duplicated)
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
    const response = await axiosInstance.post(`/workflows/${workflowId}/publish`, publishData)
    return response.data
  },

  // Templates
  async deleteTemplate(templateId: string): Promise<void> {
    await axiosInstance.delete(`/templates/${templateId}`)
  },

  // Executions
  async executeWorkflow(
    workflowId: string,
    inputs: Record<string, any> = {}
  ): Promise<ExecutionState> {
    console.log('[API Client] executeWorkflow called with:', { workflowId, inputs })
    try {
      const url = `/workflows/${workflowId}/execute`
      const payload = {
        workflow_id: workflowId,
        inputs,
      }
      console.log('[API Client] POST request to:', url)
      console.log('[API Client] Request payload:', payload)
      const response = await axiosInstance.post(url, payload)
      console.log('[API Client] Response received:', {
        status: response.status,
        data: response.data
      })
      return response.data
    } catch (error: any) {
      console.error('[API Client] executeWorkflow error:', error)
      console.error('[API Client] Error details:', {
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
    const response = await axiosInstance.get(`/executions/${executionId}`)
    return response.data
  },

  // Settings
  async getLLMSettings(): Promise<any> {
    try {
      const response = await axiosInstance.get('/settings/llm')
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

