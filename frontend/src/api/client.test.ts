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
    })),
    createSessionStorageAdapter: jest.fn(() => ({
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
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
    }

    mockSessionStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
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
      ;(mockInstance.delete as jest.Mock).mockResolvedValue({})

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
      ;(mockInstance.delete as jest.Mock).mockResolvedValue({})

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
      const api = createApiClient({ baseURL: 'https://custom.api.com' })
      
      expect(mockedAxios.create).toHaveBeenCalledWith({ baseURL: 'https://custom.api.com' })
    })

    it('should use custom axios instance', () => {
      const customInstance = mockInstance
      const api = createApiClient({ axiosInstance: customInstance })
      
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
      mockInstance.interceptors.request.use.mockImplementation((onFulfilled, onRejected) => {
        if (onRejected) {
          onRejected(error)
        }
      })

      createApiClient({
        localStorage: mockLocalStorage,
        sessionStorage: mockSessionStorage,
      })

      // Should not crash
      expect(mockInstance.interceptors.request.use).toHaveBeenCalled()
    })
  })
})
