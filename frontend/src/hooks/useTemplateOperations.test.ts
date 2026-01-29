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

  describe('deleteSelectedAgents', () => {
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
        await result.current.deleteSelectedAgents(new Set())
      })

      expect(mockShowConfirm).not.toHaveBeenCalled()
    })

    it('should filter out official agents', async () => {
      const agents = [
        { ...mockAgents[0], id: 'agent-1', is_official: true },
        { ...mockAgents[0], id: 'agent-2', is_official: false, author_id: 'user-1' },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
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
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Cannot delete 1 official agent(s)')
      )
    })

    it('should show error when user owns no agents', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-2' }, // Different user
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalled()
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should show partial delete confirmation when user owns some agents', async () => {
      const agents = [
        { ...mockAgents[0], id: 'agent-1', author_id: 'user-1' },
        { ...mockAgents[0], id: 'agent-2', author_id: 'user-2' },
      ]

      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
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
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining('You can only delete 1 of 2 selected agent(s)'),
        expect.objectContaining({
          title: 'Partial Delete',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          type: 'warning',
        })
      )
    })

    it('should delete agents successfully', async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify(mockAgents))

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: mockAgents,
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowConfirm).toHaveBeenCalled()
      expect(mockStorage.setItem).toHaveBeenCalled()
      expect(mockSetAgents).toHaveBeenCalled()
      expect(mockSetSelectedAgentIds).toHaveBeenCalledWith(new Set())
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
          agents: mockAgents,
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete agents')
      )
    })

    it('should handle agents with no author_id', async () => {
      const agents = [
        { ...mockAgents[0], author_id: null },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalled()
    })
  })

  describe('deleteSelectedAgents', () => {
    beforeEach(() => {
      mockStorage.getItem.mockReturnValue(JSON.stringify(mockAgents))
    })

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
        await result.current.deleteSelectedAgents(new Set())
      })

      expect(mockShowConfirm).not.toHaveBeenCalled()
    })

    it('should filter out official agents', async () => {
      const agents = [
        { ...mockAgents[0], id: 'agent-1', is_official: true },
        { ...mockAgents[0], id: 'agent-2', is_official: false, author_id: 'user-1' },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
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
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Cannot delete 1 official agent(s)')
      )
    })

    it('should return early when all selected are official', async () => {
      const agents = [
        { ...mockAgents[0], id: 'agent-1', is_official: true },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalled()
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should show error when user owns no agents and no author_id', async () => {
      const agents = [
        { ...mockAgents[0], author_id: null },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('were published before author tracking was added')
      )
    })

    it('should show error when user owns no agents but agents have author_id', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-2' }, // Different user
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('You can only delete agents that you published')
      )
    })

    it('should show partial delete confirmation when user owns some agents', async () => {
      const agents = [
        { ...mockAgents[0], id: 'agent-1', author_id: 'user-1' },
        { ...mockAgents[0], id: 'agent-2', author_id: 'user-2' },
      ]

      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
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
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining('You can only delete 1 of 2 selected agent(s)'),
        expect.objectContaining({
          title: 'Partial Delete',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          type: 'warning',
        })
      )
    })

    it('should show full delete confirmation when user owns all agents', async () => {
      const agents = [
        { ...mockAgents[0], id: 'agent-1', author_id: 'user-1' },
        { ...mockAgents[0], id: 'agent-2', author_id: 'user-1' },
      ]

      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
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
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to delete 2 selected agent(s)'),
        expect.objectContaining({
          title: 'Delete Agents',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          type: 'danger',
        })
      )
    })

    it('should not delete when user cancels confirmation', async () => {
      mockShowConfirm.mockResolvedValue(false)

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: mockAgents,
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should delete agents successfully', async () => {
      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: mockAgents,
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockStorage.setItem).toHaveBeenCalled()
      expect(mockSetAgents).toHaveBeenCalled()
      expect(mockSetSelectedAgentIds).toHaveBeenCalledWith(new Set())
      expect(mockShowSuccess).toHaveBeenCalledWith('Successfully deleted 1 agent(s)')
    })

    it('should handle missing storage', async () => {
      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: null,
          agents: mockAgents,
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith('Storage not available')
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
          agents: mockAgents,
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete agents')
      )
    })

    it('should handle when publishedAgents is null', async () => {
      mockStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: mockAgents,
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should not call setItem when publishedAgents is null
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('should handle String conversion for author_id comparison', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 123 }, // Number author_id
      ]

      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: '123', username: 'testuser' }, // String user id
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowConfirm).toHaveBeenCalled()
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

      expect(mockLoggerError).toHaveBeenCalled()
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

      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle workflow with null id', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ id: null }),
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

      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('workflow=null'))
    })

    it('should handle workflow with undefined id', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ id: undefined }),
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

      expect(mockNavigate).toHaveBeenCalled()
    })

    it('should handle response.json() throwing error', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Parse error') },
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

      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle response.text() throwing error', async () => {
      mockHttpClient.post.mockResolvedValue({
        ok: false,
        text: async () => { throw new Error('Text error') },
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

      expect(mockLoggerError).toHaveBeenCalled()
    })
  })

  describe('deleteSelectedAgents edge cases', () => {
    it('should handle user.id as empty string', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-1' },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: '', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalled()
    })

    it('should handle author_id as null vs undefined', async () => {
      const agents = [
        { ...mockAgents[0], author_id: null },
        { ...mockAgents[0], id: 'agent-2', author_id: undefined },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('published before author tracking')
      )
    })

    it('should handle String conversion for numeric author_id', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 123 },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: '123', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockSetAgents).toHaveBeenCalled()
    })

    it('should handle publishedAgents as empty string', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-1' },
      ]
      mockStorage.getItem.mockReturnValue('')

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockSetAgents).not.toHaveBeenCalled()
    })

    it('should handle JSON.parse throwing error', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-1' },
      ]
      mockStorage.getItem.mockReturnValue('invalid json')

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete agents')
      )
    })

    it('should handle error without message property', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-1' },
      ]
      mockStorage.getItem.mockImplementation(() => {
        throw { toString: () => 'Error without message' }
      })

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Unknown error')
      )
    })
  })

  describe('deleteSelectedWorkflows edge cases', () => {
    it('should handle activeTab as workflows-of-workflows', async () => {
      const workflows = [
        { ...mockTemplates[0], author_id: 'user-1' },
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
          workflowsOfWorkflows: workflows,
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

      expect(mockDeleteTemplate).toHaveBeenCalled()
    })

    it('should handle String conversion for numeric author_id in workflows', async () => {
      const workflows = [
        { ...mockTemplates[0], author_id: 123 },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: '123', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: workflows,
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

      expect(mockDeleteTemplate).toHaveBeenCalled()
    })

    it('should handle Promise.all with partial errors', async () => {
      const workflows = [
        { ...mockTemplates[0], author_id: 'user-1' },
        { ...mockTemplates[0], id: 'template-2', author_id: 'user-1' },
      ]
      mockDeleteTemplate
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Delete failed'))

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: workflows,
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

      expect(mockShowError).toHaveBeenCalled()
    })

    it('should handle error.response.data.detail as null', async () => {
      const workflows = [
        { ...mockTemplates[0], author_id: 'user-1' },
      ]
      const error: any = new Error('Delete failed')
      error.response = { data: { detail: null } }
      mockDeleteTemplate.mockRejectedValue(error)

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: workflows,
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

    it('should handle error without message property', async () => {
      const workflows = [
        { ...mockTemplates[0], author_id: 'user-1' },
      ]
      const error: any = {}
      mockDeleteTemplate.mockRejectedValue(error)

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: workflows,
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
        expect.stringContaining('Unknown error')
      )
    })
  })

  describe('deleteSelectedRepositoryAgents edge cases', () => {
    it('should handle onRefresh as undefined', async () => {
      const agents = [
        { ...mockAgents[0] },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

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
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']), undefined)
      })

      expect(mockSetRepositoryAgents).toHaveBeenCalled()
    })

    it('should handle repositoryAgents as empty string', async () => {
      mockStorage.getItem.mockReturnValue('')

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

      expect(mockSetRepositoryAgents).not.toHaveBeenCalled()
    })

    it('should handle JSON.parse throwing error', async () => {
      mockStorage.getItem.mockReturnValue('invalid json')

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

    it('should handle error without message property', async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw { toString: () => 'Error without message' }
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
        expect.stringContaining('Unknown error')
      )
    })
  })

  describe('mutation killers for useTemplate', () => {
    it('should verify response.ok check by testing false path explicitly', async () => {
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

      // Verify navigate was NOT called when response.ok is false
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should verify exact logger.debug message content', async () => {
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

      // Verify exact log message to kill StringLiteral mutant
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        'Created workflow from template:',
        { id: 'workflow-123' }
      )
    })

    it('should verify exact logger.error message content', async () => {
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

      // Verify exact error message to kill StringLiteral mutant
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Failed to use template:',
        'Error message'
      )
    })
  })

  describe('mutation killers for deleteSelectedAgents', () => {
    it('should verify selectedAgentIds.size === 0 early return', async () => {
      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: mockAgents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set())
      })

      // Verify early return - no further operations should happen
      expect(mockShowError).not.toHaveBeenCalled()
      expect(mockShowConfirm).not.toHaveBeenCalled()
      expect(mockSetAgents).not.toHaveBeenCalled()
    })

    it('should verify agents.filter is called with correct predicate', async () => {
      const agents = [
        { ...mockAgents[0], id: 'agent-1' },
        { ...mockAgents[0], id: 'agent-2' },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Verify that filtering happened - should only process agent-1
      // If filter was mutated to return all agents, this would fail
      expect(mockShowConfirm).toHaveBeenCalled()
      const confirmCall = mockShowConfirm.mock.calls[0][0]
      expect(confirmCall).toContain('1 selected agent')
    })

    it('should verify officialAgents.length > 0 boundary (exactly 0)', async () => {
      const agents = [
        { ...mockAgents[0], is_official: false },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // When officialAgents.length === 0, should not show the official agents error
      expect(mockShowError).not.toHaveBeenCalledWith(
        expect.stringContaining('official agent')
      )
    })

    it('should verify officialAgents.length > 0 boundary (exactly 1)', async () => {
      const agents = [
        { ...mockAgents[0], is_official: true },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // When officialAgents.length === 1 (> 0), should show error
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('official agent')
      )
    })

    it('should verify deletableAgents.length === 0 check', async () => {
      const agents = [
        { ...mockAgents[0], is_official: true },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // When deletableAgents.length === 0 (all are official), should return early
      expect(mockShowConfirm).not.toHaveBeenCalled()
      expect(mockSetAgents).not.toHaveBeenCalled()
    })

    it('should verify userOwnedAgents.length === 0 path with agentsWithAuthorId.length === 0 and officialAgents.length > 0', async () => {
      const agents = [
        { ...mockAgents[0], author_id: null, is_official: false },
        { ...mockAgents[0], id: 'agent-2', author_id: null, is_official: true },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      // Should show error about official agents and no author tracking
      expect(mockShowError).toHaveBeenCalledWith(
        'Selected agents were published before author tracking was added or are official. Please republish them to enable deletion.'
      )
    })

    it('should verify userOwnedAgents.length === 0 path with agentsWithAuthorId.length === 0 and officialAgents.length === 0', async () => {
      const agents = [
        { ...mockAgents[0], author_id: null, is_official: false },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should show error about no author tracking (no official agents)
      expect(mockShowError).toHaveBeenCalledWith(
        'Selected agents were published before author tracking was added. Please republish them to enable deletion.'
      )
    })

    it('should verify userOwnedAgents.length === 0 path with agentsWithAuthorId.length > 0 and officialAgents.length > 0', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-2', is_official: false },
        { ...mockAgents[0], id: 'agent-2', author_id: 'user-2', is_official: true },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      // Should show error about official agents and mismatched author IDs
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('You can only delete agents that you published (official agents cannot be deleted)')
      )
    })

    it('should verify userOwnedAgents.length === 0 path with agentsWithAuthorId.length > 0 and officialAgents.length === 0', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-2', is_official: false },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should show error about mismatched author IDs (no official agents)
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('You can only delete agents that you published')
      )
      expect(mockShowError).not.toHaveBeenCalledWith(
        expect.stringContaining('official agents cannot be deleted')
      )
    })

    it('should verify userOwnedAgents filter logic with !user check', async () => {
      const agents = [
        { ...mockAgents[0] },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: null,
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // When user is null, userOwnedAgents should be empty
      expect(mockShowError).toHaveBeenCalled()
    })

    it('should verify userOwnedAgents filter logic with !a.author_id check', async () => {
      const agents = [
        { ...mockAgents[0], author_id: null },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // When author_id is null, userOwnedAgents should be empty
      expect(mockShowError).toHaveBeenCalled()
    })

    it('should verify userOwnedAgents.length < deletableAgents.length path', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-1' },
        { ...mockAgents[0], id: 'agent-2', author_id: 'user-2' },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))
      mockShowConfirm.mockResolvedValue(true)

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
      })

      // Should show partial delete confirmation
      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining('You can only delete 1 of 2 selected agent(s)'),
        expect.any(Object)
      )
    })

    it('should verify userOwnedAgents.length === deletableAgents.length path', async () => {
      const agents = [
        { ...mockAgents[0], author_id: 'user-1' },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))
      mockShowConfirm.mockResolvedValue(true)

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1']))
      })

      // Should show full delete confirmation (not partial)
      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to delete 1 selected agent(s)'),
        expect.any(Object)
      )
    })

    it('should verify setAgents filter predicate is called correctly', async () => {
      const agents = [
        { ...mockAgents[0], id: 'agent-1', author_id: 'user-1' },
        { ...mockAgents[0], id: 'agent-2', author_id: 'user-1' },
        { ...mockAgents[0], id: 'agent-3', author_id: 'user-2' },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))
      mockShowConfirm.mockResolvedValue(true)

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents,
          templates: [],
          workflowsOfWorkflows: [],
          activeTab: 'agents',
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
        await result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2', 'agent-3']))
      })

      // Verify setAgents was called with filter that removes agent-1 and agent-2
      expect(mockSetAgents).toHaveBeenCalled()
      const setAgentsCall = mockSetAgents.mock.calls[0][0]
      const filteredAgents = typeof setAgentsCall === 'function' ? setAgentsCall(agents) : setAgentsCall
      // Should only have agent-3 remaining (user-2's agent)
      expect(filteredAgents.length).toBe(1)
      expect(filteredAgents[0].id).toBe('agent-3')
    })
  })

  describe('mutation killers for deleteSelectedWorkflows', () => {
    it('should verify selectedTemplateIds.size === 0 early return', async () => {
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

      // Verify early return
      expect(mockShowError).not.toHaveBeenCalled()
      expect(mockShowConfirm).not.toHaveBeenCalled()
      expect(mockDeleteTemplate).not.toHaveBeenCalled()
    })

    it('should verify activeTab === workflows-of-workflows branch', async () => {
      const workflows = [
        { ...mockTemplates[0], author_id: 'user-1' },
      ]
      mockDeleteTemplate.mockResolvedValue(undefined)
      mockShowConfirm.mockResolvedValue(true)

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: [],
          workflowsOfWorkflows: workflows,
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

      // Should use workflowsOfWorkflows, not templates
      expect(mockDeleteTemplate).toHaveBeenCalled()
    })

    it('should verify officialTemplates.length > 0 boundary (exactly 0)', async () => {
      const workflows = [
        { ...mockTemplates[0], is_official: false },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: workflows,
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

      // Should not show official templates error when length is 0
      expect(mockShowError).not.toHaveBeenCalledWith(
        expect.stringContaining('official workflow')
      )
    })

    it('should verify officialTemplates.length > 0 boundary (exactly 1)', async () => {
      const workflows = [
        { ...mockTemplates[0], is_official: true },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: workflows,
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

      // Should show official templates error when length > 0
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('official workflow')
      )
    })

    it('should verify deletableTemplates.length === 0 check', async () => {
      const workflows = [
        { ...mockTemplates[0], is_official: true },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: workflows,
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

      // When deletableTemplates.length === 0, should return early
      expect(mockShowConfirm).not.toHaveBeenCalled()
      expect(mockDeleteTemplate).not.toHaveBeenCalled()
    })

    it('should verify userOwnedTemplates.length === 0 path with officialTemplates.length > 0', async () => {
      const workflows = [
        { ...mockTemplates[0], author_id: 'user-2', is_official: false },
        { ...mockTemplates[0], id: 'template-2', author_id: 'user-2', is_official: true },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: workflows,
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

      // Should show error about official workflows
      expect(mockShowError).toHaveBeenCalledWith(
        'You can only delete workflows that you published (official workflows cannot be deleted)'
      )
    })

    it('should verify userOwnedTemplates.length === 0 path with officialTemplates.length === 0', async () => {
      const workflows = [
        { ...mockTemplates[0], author_id: 'user-2', is_official: false },
      ]

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: workflows,
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

      // Should show error without official workflows mention
      expect(mockShowError).toHaveBeenCalledWith(
        'You can only delete workflows that you published'
      )
    })

    it('should verify userOwnedTemplates.length < deletableTemplates.length path', async () => {
      const workflows = [
        { ...mockTemplates[0], author_id: 'user-1' },
        { ...mockTemplates[0], id: 'template-2', author_id: 'user-2' },
      ]
      mockDeleteTemplate.mockResolvedValue(undefined)
      mockShowConfirm.mockResolvedValue(true)

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: workflows,
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

      // Should show partial delete confirmation
      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining('You can only delete 1 of 2 selected workflow(s)'),
        expect.any(Object)
      )
    })

    it('should verify setTemplates and setWorkflowsOfWorkflows filters are called correctly', async () => {
      const workflows = [
        { ...mockTemplates[0], id: 'template-1', author_id: 'user-1' },
        { ...mockTemplates[0], id: 'template-2', author_id: 'user-1' },
      ]
      mockDeleteTemplate.mockResolvedValue(undefined)
      mockShowConfirm.mockResolvedValue(true)

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: workflows,
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

      // Verify both setters were called with filters
      expect(mockSetTemplates).toHaveBeenCalled()
      expect(mockSetWorkflowsOfWorkflows).toHaveBeenCalled()
      const setTemplatesCall = mockSetTemplates.mock.calls[0][0]
      const filteredTemplates = typeof setTemplatesCall === 'function' ? setTemplatesCall(workflows) : setTemplatesCall
      expect(filteredTemplates.length).toBe(0) // Both should be deleted
    })

    it('should verify error handling with error.response.data.detail', async () => {
      const workflows = [
        { ...mockTemplates[0], author_id: 'user-1' },
      ]
      const error: any = new Error('Delete failed')
      error.response = { data: { detail: 'Custom error detail' } }
      mockDeleteTemplate.mockRejectedValue(error)
      mockShowConfirm.mockResolvedValue(true)

      const { result } = renderHook(() =>
        useTemplateOperations({
          token: 'token',
          user: { id: 'user-1', username: 'testuser' },
          httpClient: mockHttpClient as any,
          apiBaseUrl: 'http://api.test',
          storage: mockStorage as any,
          agents: [],
          templates: workflows,
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

      // Should show error with detail from response
      expect(mockShowError).toHaveBeenCalledWith(
        'Failed to delete workflows: Custom error detail'
      )
    })
  })

  describe('mutation killers for deleteSelectedRepositoryAgents', () => {
    it('should verify selectedRepositoryAgentIds.size === 0 early return', async () => {
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

      // Verify early return
      expect(mockShowError).not.toHaveBeenCalled()
      expect(mockShowConfirm).not.toHaveBeenCalled()
      expect(mockSetRepositoryAgents).not.toHaveBeenCalled()
    })

    it('should verify exact showSuccess message content', async () => {
      const agents = [
        { ...mockAgents[0] },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))
      mockShowConfirm.mockResolvedValue(true)

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

      // Verify exact success message to kill StringLiteral mutant
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Successfully deleted 1 agent(s)'
      )
    })

    it('should verify onRefresh callback is called when provided', async () => {
      const agents = [
        { ...mockAgents[0] },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))
      mockShowConfirm.mockResolvedValue(true)
      const mockOnRefresh = jest.fn()

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
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1']), mockOnRefresh)
      })

      // Verify onRefresh was called
      expect(mockOnRefresh).toHaveBeenCalled()
    })

    it('should verify setRepositoryAgents filter predicate is called correctly', async () => {
      const agents = [
        { ...mockAgents[0], id: 'agent-1' },
        { ...mockAgents[0], id: 'agent-2' },
        { ...mockAgents[0], id: 'agent-3' },
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents))
      mockShowConfirm.mockResolvedValue(true)

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
        await result.current.deleteSelectedRepositoryAgents(new Set(['agent-1', 'agent-2']))
      })

      // Verify setRepositoryAgents was called with filter that removes agent-1 and agent-2
      expect(mockSetRepositoryAgents).toHaveBeenCalled()
      const setRepositoryAgentsCall = mockSetRepositoryAgents.mock.calls[0][0]
      expect(setRepositoryAgentsCall.length).toBe(1) // Only agent-3 should remain
      expect(setRepositoryAgentsCall[0].id).toBe('agent-3')
    })
  })
})
