import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWorkflowAPI } from './useWorkflowAPI'
import { api } from '../api/client'
import { logger } from '../utils/logger'

// Mock the API client
vi.mock('../api/client', () => ({
  api: {
    getWorkflows: vi.fn(),
    getWorkflow: vi.fn(),
    createWorkflow: vi.fn(),
    updateWorkflow: vi.fn(),
    deleteWorkflow: vi.fn(),
    executeWorkflow: vi.fn(),
    getExecution: vi.fn(),
  }
}))

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn()
  }
}))

describe('useWorkflowAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getWorkflows', () => {
    it('should call api.getWorkflows and return workflows', async () => {
      const mockWorkflows = [
        { id: '1', name: 'Workflow 1', nodes: [], edges: [] },
        { id: '2', name: 'Workflow 2', nodes: [], edges: [] }
      ]
      vi.mocked(api.getWorkflows).mockResolvedValue(mockWorkflows as any)

      const { result } = renderHook(() => useWorkflowAPI())
      const workflows = await result.current.getWorkflows()

      expect(api.getWorkflows).toHaveBeenCalledTimes(1)
      expect(workflows).toEqual(mockWorkflows)
    })

    it('should log error and throw when api.getWorkflows fails', async () => {
      const error = new Error('Failed to fetch')
      vi.mocked(api.getWorkflows).mockRejectedValue(error)

      const { result } = renderHook(() => useWorkflowAPI())
      
      await expect(result.current.getWorkflows()).rejects.toThrow('Failed to fetch')
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch workflows:', error)
    })
  })

  describe('getWorkflow', () => {
    it('should call api.getWorkflow with id and return workflow', async () => {
      const mockWorkflow = { id: '1', name: 'Workflow 1', nodes: [], edges: [] }
      vi.mocked(api.getWorkflow).mockResolvedValue(mockWorkflow as any)

      const { result } = renderHook(() => useWorkflowAPI())
      const workflow = await result.current.getWorkflow('1')

      expect(api.getWorkflow).toHaveBeenCalledWith('1')
      expect(workflow).toEqual(mockWorkflow)
    })

    it('should log error with workflow id and throw when api.getWorkflow fails', async () => {
      const error = new Error('Not found')
      vi.mocked(api.getWorkflow).mockRejectedValue(error)

      const { result } = renderHook(() => useWorkflowAPI())
      
      await expect(result.current.getWorkflow('1')).rejects.toThrow('Not found')
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch workflow 1:', error)
    })
  })

  describe('createWorkflow', () => {
    it('should call api.createWorkflow with workflow and return created workflow', async () => {
      const newWorkflow = { name: 'New Workflow', nodes: [], edges: [] }
      const createdWorkflow = { id: '1', ...newWorkflow }
      vi.mocked(api.createWorkflow).mockResolvedValue(createdWorkflow as any)

      const { result } = renderHook(() => useWorkflowAPI())
      const workflow = await result.current.createWorkflow(newWorkflow as any)

      expect(api.createWorkflow).toHaveBeenCalledWith(newWorkflow)
      expect(workflow).toEqual(createdWorkflow)
    })

    it('should log error and throw when api.createWorkflow fails', async () => {
      const error = new Error('Creation failed')
      vi.mocked(api.createWorkflow).mockRejectedValue(error)

      const { result } = renderHook(() => useWorkflowAPI())
      
      await expect(result.current.createWorkflow({} as any)).rejects.toThrow('Creation failed')
      expect(logger.error).toHaveBeenCalledWith('Failed to create workflow:', error)
    })
  })

  describe('updateWorkflow', () => {
    it('should call api.updateWorkflow with id and workflow and return updated workflow', async () => {
      const updatedWorkflow = { id: '1', name: 'Updated Workflow', nodes: [], edges: [] }
      vi.mocked(api.updateWorkflow).mockResolvedValue(updatedWorkflow as any)

      const { result } = renderHook(() => useWorkflowAPI())
      const workflow = await result.current.updateWorkflow('1', updatedWorkflow as any)

      expect(api.updateWorkflow).toHaveBeenCalledWith('1', updatedWorkflow)
      expect(workflow).toEqual(updatedWorkflow)
    })

    it('should log error with workflow id and throw when api.updateWorkflow fails', async () => {
      const error = new Error('Update failed')
      vi.mocked(api.updateWorkflow).mockRejectedValue(error)

      const { result } = renderHook(() => useWorkflowAPI())
      
      await expect(result.current.updateWorkflow('1', {} as any)).rejects.toThrow('Update failed')
      expect(logger.error).toHaveBeenCalledWith('Failed to update workflow 1:', error)
    })
  })

  describe('deleteWorkflow', () => {
    it('should call api.deleteWorkflow with id', async () => {
      vi.mocked(api.deleteWorkflow).mockResolvedValue(undefined)

      const { result } = renderHook(() => useWorkflowAPI())
      await result.current.deleteWorkflow('1')

      expect(api.deleteWorkflow).toHaveBeenCalledWith('1')
    })

    it('should log error with workflow id and throw when api.deleteWorkflow fails', async () => {
      const error = new Error('Delete failed')
      vi.mocked(api.deleteWorkflow).mockRejectedValue(error)

      const { result } = renderHook(() => useWorkflowAPI())
      
      await expect(result.current.deleteWorkflow('1')).rejects.toThrow('Delete failed')
      expect(logger.error).toHaveBeenCalledWith('Failed to delete workflow 1:', error)
    })
  })

  describe('executeWorkflow', () => {
    it('should call api.executeWorkflow with workflowId and inputs and return execution state', async () => {
      const executionState = { id: 'exec-1', status: 'running', workflow_id: '1' }
      vi.mocked(api.executeWorkflow).mockResolvedValue(executionState as any)

      const { result } = renderHook(() => useWorkflowAPI())
      const execution = await result.current.executeWorkflow('1', { input: 'value' })

      expect(api.executeWorkflow).toHaveBeenCalledWith('1', { input: 'value' })
      expect(execution).toEqual(executionState)
    })

    it('should call api.executeWorkflow without inputs', async () => {
      const executionState = { id: 'exec-1', status: 'running', workflow_id: '1' }
      vi.mocked(api.executeWorkflow).mockResolvedValue(executionState as any)

      const { result } = renderHook(() => useWorkflowAPI())
      await result.current.executeWorkflow('1')

      expect(api.executeWorkflow).toHaveBeenCalledWith('1', undefined)
    })

    it('should log error with workflow id and throw when api.executeWorkflow fails', async () => {
      const error = new Error('Execution failed')
      vi.mocked(api.executeWorkflow).mockRejectedValue(error)

      const { result } = renderHook(() => useWorkflowAPI())
      
      await expect(result.current.executeWorkflow('1')).rejects.toThrow('Execution failed')
      expect(logger.error).toHaveBeenCalledWith('Failed to execute workflow 1:', error)
    })
  })

  describe('getExecution', () => {
    it('should call api.getExecution with executionId and return execution state', async () => {
      const executionState = { id: 'exec-1', status: 'completed', workflow_id: '1' }
      vi.mocked(api.getExecution).mockResolvedValue(executionState as any)

      const { result } = renderHook(() => useWorkflowAPI())
      const execution = await result.current.getExecution('exec-1')

      expect(api.getExecution).toHaveBeenCalledWith('exec-1')
      expect(execution).toEqual(executionState)
    })

    it('should log error with execution id and throw when api.getExecution fails', async () => {
      const error = new Error('Not found')
      vi.mocked(api.getExecution).mockRejectedValue(error)

      const { result } = renderHook(() => useWorkflowAPI())
      
      await expect(result.current.getExecution('exec-1')).rejects.toThrow('Not found')
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch execution exec-1:', error)
    })
  })

  describe('hook stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useWorkflowAPI())
      
      const firstRender = {
        getWorkflows: result.current.getWorkflows,
        getWorkflow: result.current.getWorkflow,
        createWorkflow: result.current.createWorkflow,
        updateWorkflow: result.current.updateWorkflow,
        deleteWorkflow: result.current.deleteWorkflow,
        executeWorkflow: result.current.executeWorkflow,
        getExecution: result.current.getExecution,
      }
      
      rerender()
      
      const secondRender = {
        getWorkflows: result.current.getWorkflows,
        getWorkflow: result.current.getWorkflow,
        createWorkflow: result.current.createWorkflow,
        updateWorkflow: result.current.updateWorkflow,
        deleteWorkflow: result.current.deleteWorkflow,
        executeWorkflow: result.current.executeWorkflow,
        getExecution: result.current.getExecution,
      }
      
      // Functions should be stable (same reference)
      expect(firstRender.getWorkflows).toBe(secondRender.getWorkflows)
      expect(firstRender.getWorkflow).toBe(secondRender.getWorkflow)
      expect(firstRender.createWorkflow).toBe(secondRender.createWorkflow)
      expect(firstRender.updateWorkflow).toBe(secondRender.updateWorkflow)
      expect(firstRender.deleteWorkflow).toBe(secondRender.deleteWorkflow)
      expect(firstRender.executeWorkflow).toBe(secondRender.executeWorkflow)
      expect(firstRender.getExecution).toBe(secondRender.getExecution)
    })
  })
})

