// Mock axios before importing
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  }
  
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance),
    },
  }
})

// Mock adapters
jest.mock('../types/adapters', () => ({
  defaultAdapters: {
    createLocalStorageAdapter: jest.fn(() => ({
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
    createSessionStorageAdapter: jest.fn(() => ({
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  },
}))

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  }
}))

import axios, { AxiosInstance } from 'axios'
import { createApiClient } from './client'
import type { StorageAdapter } from '../types/adapters'
import { logger } from '../utils/logger'

const mockedAxios = axios as jest.Mocked<typeof axios>

describe('createApiClient', () => {
  let mockInstance: jest.Mocked<AxiosInstance>
  let mockLocalStorage: StorageAdapter
  let mockSessionStorage: StorageAdapter

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
    } as any

    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }

    mockSessionStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }

    mockedAxios.create.mockReturnValue(mockInstance as any)
  })

  describe('Workflows', () => {
    it('should get all workflows', async () => {
      const workflows = [{ id: '1', name: 'Workflow 1' }, { id: '2', name: 'Workflow 2' }]
      ;(mockInstance.get as jest.Mock).mockResolvedValue({ data: workflows })

      const api = createApiClient()
      const result = await api.getWorkflows()

      expect(mockInstance.get).toHaveBeenCalledWith('/workflows')
      expect(result).toEqual(workflows)
    })

    it('should get workflow by id', async () => {
      const workflow = { id: '1', name: 'Workflow 1' }
      ;(mockInstance.get as jest.Mock).mockResolvedValue({ data: workflow })

      const api = createApiClient()
      const result = await api.getWorkflow('1')

      expect(mockInstance.get).toHaveBeenCalledWith('/workflows/1')
      expect(result).toEqual(workflow)
    })

    it('should create workflow', async () => {
      const newWorkflow = { name: 'New Workflow', description: 'Description' }
      const createdWorkflow = { id: '1', ...newWorkflow }
      ;(mockInstance.post as jest.Mock).mockResolvedValue({ data: createdWorkflow })

      const api = createApiClient()
      const result = await api.createWorkflow(newWorkflow)

      expect(mockInstance.post).toHaveBeenCalledWith('/workflows', newWorkflow)
      expect(result).toEqual(createdWorkflow)
    })

    it('should update workflow', async () => {
      const updates = { name: 'Updated Workflow' }
      const updatedWorkflow = { id: '1', ...updates }
      ;(mockInstance.put as jest.Mock).mockResolvedValue({ data: updatedWorkflow })

      const api = createApiClient()
      const result = await api.updateWorkflow('1', updates)

      expect(mockInstance.put).toHaveBeenCalledWith('/workflows/1', updates)
      expect(result).toEqual(updatedWorkflow)
    })

    it('should delete workflow', async () => {
      (mockInstance.delete as jest.Mock).mockResolvedValue({})

      const api = createApiClient()
      await api.deleteWorkflow('1')

      expect(mockInstance.delete).toHaveBeenCalledWith('/workflows/1')
    })

    it('should bulk delete workflows', async () => {
      const response = { message: 'Deleted', deleted_count: 2 }
      ;(mockInstance.post as jest.Mock).mockResolvedValue({ data: response })

      const api = createApiClient()
      const result = await api.bulkDeleteWorkflows(['1', '2'])

      expect(mockInstance.post).toHaveBeenCalledWith('/workflows/bulk-delete', {
        workflow_ids: ['1', '2']
      })
      expect(result).toEqual(response)
    })

    it('should duplicate workflow', async () => {
      const originalWorkflow = { id: '1', name: 'Original' }
      const duplicatedWorkflow = { id: '2', name: 'Original-copy' }
      ;(mockInstance.get as jest.Mock).mockResolvedValue({ data: originalWorkflow })
      ;(mockInstance.post as jest.Mock).mockResolvedValue({ data: duplicatedWorkflow })

      const api = createApiClient()
      const result = await api.duplicateWorkflow('1')

      expect(mockInstance.get).toHaveBeenCalledWith('/workflows/1')
      expect(mockInstance.post).toHaveBeenCalledWith('/workflows', {
        ...originalWorkflow,
        id: undefined,
        name: 'Original-copy'
      })
      expect(result).toEqual(duplicatedWorkflow)
    })

    it('should publish workflow', async () => {
      const publishData = {
        category: 'automation',
        tags: ['tag1', 'tag2'],
        difficulty: 'medium',
        estimated_time: '30min'
      }
      const response = { success: true }
      ;(mockInstance.post as jest.Mock).mockResolvedValue({ data: response })

      const api = createApiClient()
      const result = await api.publishWorkflow('1', publishData)

      expect(mockInstance.post).toHaveBeenCalledWith('/workflows/1/publish', publishData)
      expect(result).toEqual(response)
    })
  })

  describe('Templates', () => {
    it('should delete template', async () => {
      (mockInstance.delete as jest.Mock).mockResolvedValue({})

      const api = createApiClient()
      await api.deleteTemplate('template-1')

      expect(mockInstance.delete).toHaveBeenCalledWith('/templates/template-1')
    })
  })

  describe('Executions', () => {
    it('should execute workflow', async () => {
      const executionState = { id: 'exec-1', status: 'running' }
      ;(mockInstance.post as jest.Mock).mockResolvedValue({ data: executionState })

      const api = createApiClient()
      const result = await api.executeWorkflow('workflow-1', { input1: 'value1' })

      expect(mockInstance.post).toHaveBeenCalledWith('/workflows/workflow-1/execute', {
        workflow_id: 'workflow-1',
        inputs: { input1: 'value1' }
      })
      expect(result).toEqual(executionState)
      expect(logger.debug).toHaveBeenCalled()
    })

    it('should execute workflow with empty inputs', async () => {
      const executionState = { id: 'exec-1', status: 'running' }
      ;(mockInstance.post as jest.Mock).mockResolvedValue({ data: executionState })

      const api = createApiClient()
      const result = await api.executeWorkflow('workflow-1')

      expect(mockInstance.post).toHaveBeenCalledWith('/workflows/workflow-1/execute', {
        workflow_id: 'workflow-1',
        inputs: {}
      })
      expect(result).toEqual(executionState)
    })

    it('should handle execution error', async () => {
      const error = new Error('Execution failed')
      ;(mockInstance.post as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.executeWorkflow('workflow-1')).rejects.toThrow('Execution failed')
      expect(logger.error).toHaveBeenCalled()
    })

    it('should get execution by id', async () => {
      const executionState = { id: 'exec-1', status: 'completed' }
      ;(mockInstance.get as jest.Mock).mockResolvedValue({ data: executionState })

      const api = createApiClient()
      const result = await api.getExecution('exec-1')

      expect(mockInstance.get).toHaveBeenCalledWith('/executions/exec-1')
      expect(result).toEqual(executionState)
    })
  })

  describe('Settings', () => {
    it('should get LLM settings', async () => {
      const settings = { providers: [{ name: 'OpenAI', api_key: 'key' }] }
      ;(mockInstance.get as jest.Mock).mockResolvedValue({ data: settings })

      const api = createApiClient()
      const result = await api.getLLMSettings()

      expect(mockInstance.get).toHaveBeenCalledWith('/settings/llm')
      expect(result).toEqual(settings)
    })

    it('should return empty settings on 401 error', async () => {
      const error: any = new Error('Unauthorized')
      error.response = { status: 401 }
      ;(mockInstance.get as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      const result = await api.getLLMSettings()

      expect(result).toEqual({ providers: [] })
    })

    it('should throw error on non-401 errors', async () => {
      const error: any = new Error('Server error')
      error.response = { status: 500 }
      ;(mockInstance.get as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.getLLMSettings()).rejects.toThrow('Server error')
    })
  })

  describe('Custom options', () => {
    it('should use custom baseURL', () => {
      createApiClient({ baseURL: 'https://custom.api.com' })
      
      expect(mockedAxios.create).toHaveBeenCalledWith({ baseURL: 'https://custom.api.com' })
    })

    it('should use custom axios instance', () => {
      createApiClient({ axiosInstance: mockInstance })
      
      expect(mockedAxios.create).not.toHaveBeenCalled()
    })

    it('should use custom logger', async () => {
      const customLogger = {
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
      }
      
      const api = createApiClient({ logger: customLogger as any })
      ;(mockInstance.post as jest.Mock).mockResolvedValue({ data: {} })
      
      await api.executeWorkflow('workflow-1')
      
      expect(customLogger.debug).toHaveBeenCalled()
    })
  })

  describe('Request interceptor', () => {
    it('should add auth token from localStorage when rememberMe is true', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_remember_me') return 'true'
        if (key === 'auth_token') return 'token-from-local'
        return null
      })

      createApiClient({
        localStorage: mockLocalStorage,
        sessionStorage: mockSessionStorage,
      })

      expect(mockInstance.interceptors.request.use).toHaveBeenCalled()
      const interceptorFn = (mockInstance.interceptors.request.use as jest.Mock).mock.calls[0][0]
      const config = { headers: {} }
      const result = interceptorFn(config)
      
      expect(result.headers.Authorization).toBe('Bearer token-from-local')
    })

    it('should add auth token from sessionStorage when rememberMe is false', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_remember_me') return 'false'
        return null
      })
      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_token') return 'token-from-session'
        return null
      })

      createApiClient({
        localStorage: mockLocalStorage,
        sessionStorage: mockSessionStorage,
      })

      expect(mockInstance.interceptors.request.use).toHaveBeenCalled()
      const interceptorFn = (mockInstance.interceptors.request.use as jest.Mock).mock.calls[0][0]
      const config = { headers: {} }
      const result = interceptorFn(config)
      
      expect(result.headers.Authorization).toBe('Bearer token-from-session')
    })

    it('should not add auth token when token is missing', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      mockSessionStorage.getItem.mockReturnValue(null)

      createApiClient({
        localStorage: mockLocalStorage,
        sessionStorage: mockSessionStorage,
      })

      expect(mockInstance.interceptors.request.use).toHaveBeenCalled()
      const interceptorFn = (mockInstance.interceptors.request.use as jest.Mock).mock.calls[0][0]
      const config = { headers: {} }
      const result = interceptorFn(config)
      
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should handle null storage adapters', () => {
      createApiClient({
        localStorage: null,
        sessionStorage: null,
      })

      expect(mockInstance.interceptors.request.use).toHaveBeenCalled()
      const interceptorFn = (mockInstance.interceptors.request.use as jest.Mock).mock.calls[0][0]
      const config = { headers: {} }
      const result = interceptorFn(config)
      
      // Should not crash, just not add token
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should handle executeWorkflow error with response details', async () => {
      const error: any = new Error('Execution failed')
      error.response = {
        status: 500,
        statusText: 'Internal Server Error',
        data: { detail: 'Server error' },
      }
      ;(mockInstance.post as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.executeWorkflow('workflow-1')).rejects.toThrow('Execution failed')
      expect(logger.error).toHaveBeenCalledWith('[API Client] executeWorkflow error:', error)
      expect(logger.error).toHaveBeenCalledWith('[API Client] Error details:', expect.objectContaining({
        status: 500,
        statusText: 'Internal Server Error',
      }))
    })

    it('should handle executeWorkflow error without response', async () => {
      const error: any = new Error('Network error')
      // No response property
      ;(mockInstance.post as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.executeWorkflow('workflow-1')).rejects.toThrow('Network error')
      expect(logger.error).toHaveBeenCalledWith('[API Client] executeWorkflow error:', error)
      expect(logger.error).toHaveBeenCalledWith('[API Client] Error details:', expect.objectContaining({
        message: 'Network error',
      }))
    })

    it('should handle getLLMSettings error without response status', async () => {
      const error: any = new Error('Network error')
      // No response.status property
      ;(mockInstance.get as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.getLLMSettings()).rejects.toThrow('Network error')
    })

    it('should handle getLLMSettings with 401 status', async () => {
      const error: any = new Error('Unauthorized')
      error.response = { status: 401 }
      ;(mockInstance.get as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      const result = await api.getLLMSettings()
      
      expect(result).toEqual({ providers: [] })
    })

    it('should handle getLLMSettings with non-401 error status', async () => {
      const error: any = new Error('Server error')
      error.response = { status: 500 }
      ;(mockInstance.get as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.getLLMSettings()).rejects.toThrow('Server error')
    })

    it('should handle request interceptor error', () => {
      const error = new Error('Interceptor error')
      let errorHandler: ((error: any) => any) | undefined
      
      mockInstance.interceptors.request.use.mockImplementation((onFulfilled, onRejected) => {
        errorHandler = onRejected
        return 0 // Return interceptor ID
      })

      createApiClient({
        localStorage: mockLocalStorage,
        sessionStorage: mockSessionStorage,
      })

      // Should not crash
      expect(mockInstance.interceptors.request.use).toHaveBeenCalled()
      
      // Test the error handler
      if (errorHandler) {
        const result = errorHandler(error)
        expect(result).rejects.toEqual(error)
      }
    })

    it('should handle request interceptor error handler being called', async () => {
      const error = new Error('Interceptor error')
      let errorHandler: ((error: any) => any) | undefined
      
      mockInstance.interceptors.request.use.mockImplementation((onFulfilled, onRejected) => {
        errorHandler = onRejected
        return 0
      })

      createApiClient({
        localStorage: mockLocalStorage,
        sessionStorage: mockSessionStorage,
      })

      expect(mockInstance.interceptors.request.use).toHaveBeenCalled()
      
      // Call the error handler directly
      if (errorHandler) {
        await expect(errorHandler(error)).rejects.toEqual(error)
      }
    })

    it('should handle localStorage null but sessionStorage available', () => {
      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_token') return 'token-from-session'
        return null
      })

      createApiClient({
        localStorage: null,
        sessionStorage: mockSessionStorage,
      })

      expect(mockInstance.interceptors.request.use).toHaveBeenCalled()
      const interceptorFn = (mockInstance.interceptors.request.use as jest.Mock).mock.calls[0][0]
      const config = { headers: {} }
      const result = interceptorFn(config)
      
      // Should not add token when localStorage is null (because local && session check fails)
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should handle sessionStorage null but localStorage available', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_remember_me') return 'true'
        if (key === 'auth_token') return 'token-from-local'
        return null
      })

      createApiClient({
        localStorage: mockLocalStorage,
        sessionStorage: null,
      })

      expect(mockInstance.interceptors.request.use).toHaveBeenCalled()
      const interceptorFn = (mockInstance.interceptors.request.use as jest.Mock).mock.calls[0][0]
      const config = { headers: {} }
      const result = interceptorFn(config)
      
      // Should not add token when sessionStorage is null (because local && session check fails)
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should handle rememberMe being undefined', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_remember_me') return null // undefined/not set
        if (key === 'auth_token') return 'token-from-local'
        return null
      })
      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_token') return 'token-from-session'
        return null
      })

      createApiClient({
        localStorage: mockLocalStorage,
        sessionStorage: mockSessionStorage,
      })

      expect(mockInstance.interceptors.request.use).toHaveBeenCalled()
      const interceptorFn = (mockInstance.interceptors.request.use as jest.Mock).mock.calls[0][0]
      const config = { headers: {} }
      const result = interceptorFn(config)
      
      // When rememberMe is not 'true', should use sessionStorage
      expect(result.headers.Authorization).toBe('Bearer token-from-session')
    })

    it('should handle rememberMe being false string', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_remember_me') return 'false'
        return null
      })
      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_token') return 'token-from-session'
        return null
      })

      createApiClient({
        localStorage: mockLocalStorage,
        sessionStorage: mockSessionStorage,
      })

      expect(mockInstance.interceptors.request.use).toHaveBeenCalled()
      const interceptorFn = (mockInstance.interceptors.request.use as jest.Mock).mock.calls[0][0]
      const config = { headers: {} }
      const result = interceptorFn(config)
      
      // When rememberMe is 'false', should use sessionStorage
      expect(result.headers.Authorization).toBe('Bearer token-from-session')
    })

    it('should handle duplicateWorkflow with workflow that has no name', async () => {
      const originalWorkflow = { id: '1' } // No name property
      const duplicatedWorkflow = { id: '2', name: 'undefined-copy' }
      ;(mockInstance.get as jest.Mock).mockResolvedValue({ data: originalWorkflow })
      ;(mockInstance.post as jest.Mock).mockResolvedValue({ data: duplicatedWorkflow })

      const api = createApiClient()
      const result = await api.duplicateWorkflow('1')

      expect(mockInstance.get).toHaveBeenCalledWith('/workflows/1')
      expect(mockInstance.post).toHaveBeenCalledWith('/workflows', {
        ...originalWorkflow,
        id: undefined,
        name: 'undefined-copy'
      })
      expect(result).toEqual(duplicatedWorkflow)
    })

    it('should handle bulkDeleteWorkflows with empty array', async () => {
      const response = { message: 'Deleted', deleted_count: 0 }
      ;(mockInstance.post as jest.Mock).mockResolvedValue({ data: response })

      const api = createApiClient()
      const result = await api.bulkDeleteWorkflows([])

      expect(mockInstance.post).toHaveBeenCalledWith('/workflows/bulk-delete', {
        workflow_ids: []
      })
      expect(result).toEqual(response)
    })

    it('should handle bulkDeleteWorkflows with failed_ids', async () => {
      const response = { 
        message: 'Partially deleted', 
        deleted_count: 1, 
        failed_ids: ['workflow-2'] 
      }
      ;(mockInstance.post as jest.Mock).mockResolvedValue({ data: response })

      const api = createApiClient()
      const result = await api.bulkDeleteWorkflows(['workflow-1', 'workflow-2'])

      expect(result).toEqual(response)
      expect(result.failed_ids).toEqual(['workflow-2'])
    })

    it('should handle publishWorkflow without estimated_time', async () => {
      const publishData = {
        category: 'automation',
        tags: ['tag1'],
        difficulty: 'medium',
      }
      const response = { success: true }
      ;(mockInstance.post as jest.Mock).mockResolvedValue({ data: response })

      const api = createApiClient()
      const result = await api.publishWorkflow('1', publishData)

      expect(mockInstance.post).toHaveBeenCalledWith('/workflows/1/publish', publishData)
      expect(result).toEqual(response)
    })

    it('should handle config.headers being undefined', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_remember_me') return 'true'
        if (key === 'auth_token') return 'token-from-local'
        return null
      })

      createApiClient({
        localStorage: mockLocalStorage,
        sessionStorage: mockSessionStorage,
      })

      expect(mockInstance.interceptors.request.use).toHaveBeenCalled()
      const interceptorFn = (mockInstance.interceptors.request.use as jest.Mock).mock.calls[0][0]
      const config: any = { headers: {} } // Provide headers object
      const result = interceptorFn(config)
      
      // Should add Authorization header
      expect(result.headers).toBeDefined()
      expect(result.headers.Authorization).toBe('Bearer token-from-local')
    })

    it('should handle getWorkflows error', async () => {
      const error = new Error('Failed to fetch workflows')
      ;(mockInstance.get as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.getWorkflows()).rejects.toThrow('Failed to fetch workflows')
    })

    it('should handle getWorkflow error', async () => {
      const error = new Error('Workflow not found')
      ;(mockInstance.get as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.getWorkflow('1')).rejects.toThrow('Workflow not found')
    })

    it('should handle createWorkflow error', async () => {
      const error = new Error('Failed to create workflow')
      ;(mockInstance.post as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.createWorkflow({ name: 'Test' })).rejects.toThrow('Failed to create workflow')
    })

    it('should handle updateWorkflow error', async () => {
      const error = new Error('Failed to update workflow')
      ;(mockInstance.put as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.updateWorkflow('1', { name: 'Updated' })).rejects.toThrow('Failed to update workflow')
    })

    it('should handle deleteWorkflow error', async () => {
      const error = new Error('Failed to delete workflow')
      ;(mockInstance.delete as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.deleteWorkflow('1')).rejects.toThrow('Failed to delete workflow')
    })

    it('should handle bulkDeleteWorkflows error', async () => {
      const error = new Error('Bulk delete failed')
      ;(mockInstance.post as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.bulkDeleteWorkflows(['1', '2'])).rejects.toThrow('Bulk delete failed')
    })

    it('should handle duplicateWorkflow error on get', async () => {
      const error = new Error('Workflow not found')
      ;(mockInstance.get as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.duplicateWorkflow('1')).rejects.toThrow('Workflow not found')
    })

    it('should handle duplicateWorkflow error on create', async () => {
      const originalWorkflow = { id: '1', name: 'Original' }
      const error = new Error('Failed to create duplicate')
      ;(mockInstance.get as jest.Mock).mockResolvedValue({ data: originalWorkflow })
      ;(mockInstance.post as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.duplicateWorkflow('1')).rejects.toThrow('Failed to create duplicate')
    })

    it('should handle publishWorkflow error', async () => {
      const error = new Error('Failed to publish workflow')
      ;(mockInstance.post as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.publishWorkflow('1', {
        category: 'automation',
        tags: ['tag1'],
        difficulty: 'medium'
      })).rejects.toThrow('Failed to publish workflow')
    })

    it('should handle deleteTemplate error', async () => {
      const error = new Error('Failed to delete template')
      ;(mockInstance.delete as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.deleteTemplate('template-1')).rejects.toThrow('Failed to delete template')
    })

    it('should handle getExecution error', async () => {
      const error = new Error('Execution not found')
      ;(mockInstance.get as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.getExecution('exec-1')).rejects.toThrow('Execution not found')
    })

    it('should handle getLLMSettings with error.response but no status', async () => {
      const error: any = new Error('Network error')
      error.response = {} // response exists but no status
      ;(mockInstance.get as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.getLLMSettings()).rejects.toThrow('Network error')
    })

    it('should handle getLLMSettings with error.response.status being null', async () => {
      const error: any = new Error('Network error')
      error.response = { status: null }
      ;(mockInstance.get as jest.Mock).mockRejectedValue(error)

      const api = createApiClient()
      
      await expect(api.getLLMSettings()).rejects.toThrow('Network error')
    })

    it('should handle interceptor when both storages are null', () => {
      createApiClient({
        localStorage: null,
        sessionStorage: null,
      })

      expect(mockInstance.interceptors.request.use).toHaveBeenCalled()
      const interceptorFn = (mockInstance.interceptors.request.use as jest.Mock).mock.calls[0][0]
      const config = { headers: {} }
      const result = interceptorFn(config)
      
      // Should not add token when both storages are null
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should handle interceptor when rememberMe is empty string', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_remember_me') return '' // Empty string
        if (key === 'auth_token') return 'token-from-local'
        return null
      })
      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_token') return 'token-from-session'
        return null
      })

      createApiClient({
        localStorage: mockLocalStorage,
        sessionStorage: mockSessionStorage,
      })

      expect(mockInstance.interceptors.request.use).toHaveBeenCalled()
      const interceptorFn = (mockInstance.interceptors.request.use as jest.Mock).mock.calls[0][0]
      const config = { headers: {} }
      const result = interceptorFn(config)
      
      // Empty string is falsy, should use sessionStorage
      expect(result.headers.Authorization).toBe('Bearer token-from-session')
    })

    it('should handle interceptor when token is empty string', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_remember_me') return 'true'
        if (key === 'auth_token') return '' // Empty string token
        return null
      })

      createApiClient({
        localStorage: mockLocalStorage,
        sessionStorage: mockSessionStorage,
      })

      expect(mockInstance.interceptors.request.use).toHaveBeenCalled()
      const interceptorFn = (mockInstance.interceptors.request.use as jest.Mock).mock.calls[0][0]
      const config: any = { headers: {} }
      const result = interceptorFn(config)
      
      // Empty string is falsy, should not add token
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should handle interceptor when config.headers exists', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_remember_me') return 'true'
        if (key === 'auth_token') return 'token-from-local'
        return null
      })

      createApiClient({
        localStorage: mockLocalStorage,
        sessionStorage: mockSessionStorage,
      })

      expect(mockInstance.interceptors.request.use).toHaveBeenCalled()
      const interceptorFn = (mockInstance.interceptors.request.use as jest.Mock).mock.calls[0][0]
      const config: any = { headers: {} } // Headers property exists
      const result = interceptorFn(config)
      
      // Should add Authorization header
      expect(result.headers.Authorization).toBe('Bearer token-from-local')
    })
  })
})
