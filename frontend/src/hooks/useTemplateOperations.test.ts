import { renderHook, act } from '@testing-library/react'
import { useTemplateOperations } from './useTemplateOperations'
import { showError, showSuccess } from '../utils/notifications'
import { showConfirm } from '../utils/confirm'
import { api } from '../api/client'
import { logger } from '../utils/logger'

jest.mock('../utils/notifications', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}))

jest.mock('../utils/confirm', () => ({
  showConfirm: jest.fn(),
}))

jest.mock('../api/client', () => ({
  api: {
    deleteTemplate: jest.fn(),
  },
}))

jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

const mockShowError = showError as jest.MockedFunction<typeof showError>
const mockShowSuccess = showSuccess as jest.MockedFunction<typeof showSuccess>
const mockShowConfirm = showConfirm as jest.MockedFunction<typeof showConfirm>
const mockDeleteTemplate = api.deleteTemplate as jest.MockedFunction<typeof api.deleteTemplate>
const mockLoggerDebug = logger.debug as jest.MockedFunction<typeof logger.debug>
const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>

describe('useTemplateOperations', () => {
  const mockHttpClient = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }
  const mockStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }
  const mockSetAgents = jest.fn()
  const mockSetTemplates = jest.fn()
  const mockSetWorkflowsOfWorkflows = jest.fn()
  const mockSetRepositoryAgents = jest.fn()
  const mockSetSelectedAgentIds = jest.fn()
  const mockSetSelectedTemplateIds = jest.fn()
  const mockSetSelectedRepositoryAgentIds = jest.fn()

  const mockAgents = [
    {
      id: 'agent-1',
      name: 'Test Agent',
      label: 'Test Agent',
      description: 'Test',
      category: 'automation',
      tags: [],
      difficulty: 'beginner',
      estimated_time: '5 min',
      agent_config: {},
      author_id: 'user-1',
      author_name: 'Test User',
    },
  ]

  const mockTemplates = [
    {
      id: 'template-1',
      name: 'Test Template',
      description: 'Test',
      category: 'automation',
      tags: [],
      difficulty: 'beginner',
      estimated_time: '5 min',
      is_official: false,
      uses_count: 0,
      likes_count: 0,
      rating: 0,
      author_id: 'user-1',
      author_name: 'Test User',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockShowConfirm.mockResolvedValue(true)
    mockDeleteTemplate.mockResolvedValue(undefined)
    mockNavigate.mockClear()
  })

  describe('deleteSelectedWorkflows', () => {
    it('should return early when no templates selected', async () => {
      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: mockTemplates,
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedWorkflows(new Set())
      })

      expect(mockDeleteTemplate).not.toHaveBeenCalled()
    })

    it('should filter out official workflows', async () => {
      const officialTemplates = [
        { ...mockTemplates[0], id: 'template-1', is_official: true },
        { ...mockTemplates[0], id: 'template-2', is_official: false, author_id: 'user-1' },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: officialTemplates,
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedWorkflows(new Set(['template-1', 'template-2']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Cannot delete 1 official workflow(s)')
      )
      expect(mockDeleteTemplate).toHaveBeenCalledWith('template-2')
    })

    it('should show error when user owns no templates', async () => {
      const templates = [
        { ...mockTemplates[0], author_id: 'user-2' }, // Different user
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates,
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedWorkflows(new Set(['template-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        'You can only delete workflows that you published'
      )
      expect(mockDeleteTemplate).not.toHaveBeenCalled()
    })

    it('should show error when user owns no templates and official templates exist', async () => {
      const templates = [
        { ...mockTemplates[0], id: 'template-1', is_official: true },
        { ...mockTemplates[0], id: 'template-2', author_id: 'user-2' },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates,
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedWorkflows(new Set(['template-1', 'template-2']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        'You can only delete workflows that you published (official workflows cannot be deleted)'
      )
    })

    it('should show partial delete confirmation when user owns some templates', async () => {
      const templates = [
        { ...mockTemplates[0], id: 'template-1', author_id: 'user-1' },
        { ...mockTemplates[0], id: 'template-2', author_id: 'user-2' },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates,
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedWorkflows(new Set(['template-1', 'template-2']))
      })

      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining('You can only delete 1 of 2 selected workflow(s)'),
        expect.objectContaining({
          title: 'Partial Delete',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          type: 'warning',
        })
      )
    })

    it('should show full delete confirmation when user owns all templates', async () => {
      const templates = [
        { ...mockTemplates[0], id: 'template-1', author_id: 'user-1' },
        { ...mockTemplates[0], id: 'template-2', author_id: 'user-1' },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates,
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedWorkflows(new Set(['template-1', 'template-2']))
      })

      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to delete 2 selected workflow(s)'),
        expect.objectContaining({
          title: 'Delete Workflows',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          type: 'danger',
        })
      )
    })

    it('should not delete when user cancels confirmation', async () => {
      mockShowConfirm.mockResolvedValue(false)

      const templates = [
        { ...mockTemplates[0], id: 'template-1', author_id: 'user-1' },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates,
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedWorkflows(new Set(['template-1']))
      })

      expect(mockDeleteTemplate).not.toHaveBeenCalled()
    })

    it('should delete workflows successfully', async () => {
      const templates = [
        { ...mockTemplates[0], id: 'template-1', author_id: 'user-1' },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates,
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedWorkflows(new Set(['template-1']))
      })

      expect(mockDeleteTemplate).toHaveBeenCalledWith('template-1')
      expect(mockSetTemplates).toHaveBeenCalled()
      expect(mockSetSelectedTemplateIds).toHaveBeenCalledWith(new Set())
      expect(mockShowSuccess).toHaveBeenCalledWith('Successfully deleted 1 workflow(s)')
    })

    it('should handle delete error', async () => {
      mockDeleteTemplate.mockRejectedValue(new Error('Delete failed'))

      const templates = [
        { ...mockTemplates[0], id: 'template-1', author_id: 'user-1' },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates,
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedWorkflows(new Set(['template-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete workflows')
      )
    })

    it('should use workflowsOfWorkflows when activeTab is workflows-of-workflows', async () => {
      const workflowsOfWorkflows = [
        { ...mockTemplates[0], id: 'template-1', author_id: 'user-1' },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: [],
          workflowsOfWorkflows,
          activeTab: 'workflows-of-workflows',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedWorkflows(new Set(['template-1']))
      })

      expect(mockDeleteTemplate).toHaveBeenCalledWith('template-1')
    })

    it('should handle String conversion for author_id comparison', async () => {
      const templates = [
        { ...mockTemplates[0], id: 'template-1', author_id: 123 }, // Number author_id
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: '123', username: 'testuser' }, // String user id
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates,
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedWorkflows(new Set(['template-1']))
      })

      expect(mockDeleteTemplate).toHaveBeenCalledWith('template-1')
    })

    it('should return early when all selected are official', async () => {
      const templates = [
        { ...mockTemplates[0], id: 'template-1', is_official: true },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates,
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedWorkflows(new Set(['template-1']))
      })

      expect(mockShowError).toHaveBeenCalled()
      expect(mockDeleteTemplate).not.toHaveBeenCalled()
    })
  })

  describe('deleteSelectedRepositoryAgents', () => {
    it('should return early when no agents selected', async () => {
      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set())
      })

      expect(mockShowConfirm).not.toHaveBeenCalled()
    })

    it('should handle missing storage', async () => {
      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: null,
          agents: [],
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith('Storage not available')
    })

    it('should delete repository agents successfully', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify(mockAgents))

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']))
      })

      expect(mockShowConfirm).toHaveBeenCalled()
      expect(mockStorage.setItem).toHaveBeenCalled()
      expect(mockSetRepositoryAgents).toHaveBeenCalled()
      expect(mockShowSuccess).toHaveBeenCalled()
    })

    it('should handle storage errors', async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete repository agents')
      )
    })
  })

  describe('useTemplate', () => {
    it('should use template successfully with token', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'workflow-123' }),
      })

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token-123',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: mockTemplates,
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-1')
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'http://api.test/templates/template-1/use',
        {},
        expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        })
      )
    })

    it('should use template successfully without token', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'workflow-123' }),
      })

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: null,
          user: null,
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: mockTemplates,
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-1')
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'http://api.test/templates/template-1/use',
        {},
        expect.objectContaining({
          'Content-Type': 'application/json',
        })
      )
      expect(mockHttpClient.post.mock.calls[0][2]).not.toHaveProperty('Authorization')
    })

    it('should handle use template error response', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: false,
        text: async () => 'Error message',
      })

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token-123',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: mockTemplates,
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-1')
      })

      expect(mockLoggerDebug).toHaveBeenCalled()
    })

    it('should handle use template exception', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token-123',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: mockTemplates,
          workflowsOfWorkflows: [],
          activeTab: 'repository',
          setAgents: mockSetAgents,
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
        })
      )

      await act(async () => {
        await result.current.useTemplate('template-1')
      })

      expect(mockLoggerDebug).toHaveBeenCalled()
    })
  })
})
