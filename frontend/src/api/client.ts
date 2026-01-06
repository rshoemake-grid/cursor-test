import axios from 'axios'
import type { WorkflowDefinition, ExecutionState } from '../types/workflow'

const API_BASE_URL = '/api'

export const api = {
  // Workflows
  async getWorkflows(): Promise<WorkflowDefinition[]> {
    const response = await axios.get(`${API_BASE_URL}/workflows`)
    return response.data
  },

  async getWorkflow(id: string): Promise<WorkflowDefinition> {
    const response = await axios.get(`${API_BASE_URL}/workflows/${id}`)
    return response.data
  },

  async createWorkflow(workflow: Omit<WorkflowDefinition, 'id'>): Promise<WorkflowDefinition> {
    const response = await axios.post(`${API_BASE_URL}/workflows`, workflow)
    return response.data
  },

  async updateWorkflow(id: string, workflow: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    const response = await axios.put(`${API_BASE_URL}/workflows/${id}`, workflow)
    return response.data
  },

  async deleteWorkflow(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/workflows/${id}`)
  },

  async bulkDeleteWorkflows(ids: string[]): Promise<{ message: string; deleted_count: number; failed_ids?: string[] }> {
    const response = await axios.post(`${API_BASE_URL}/workflows/bulk-delete`, {
      workflow_ids: ids
    })
    return response.data
  },

  // Executions
  async executeWorkflow(
    workflowId: string,
    inputs: Record<string, any> = {}
  ): Promise<ExecutionState> {
    const response = await axios.post(`${API_BASE_URL}/workflows/${workflowId}/execute`, {
      workflow_id: workflowId,
      inputs,
    })
    return response.data
  },

  async getExecution(executionId: string): Promise<ExecutionState> {
    const response = await axios.get(`${API_BASE_URL}/executions/${executionId}`)
    return response.data
  },
}

