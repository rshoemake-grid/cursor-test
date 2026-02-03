/**
 * Mutation tests to kill surviving mutants in useTemplateOperations
 * Focuses on exact comparisons, boundary conditions, string conversions, and edge cases
 */

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

describe('useTemplateOperations - Mutation Killers', () => {
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
    { id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
    { id: 'agent-2', name: 'Agent 2', is_official: true, author_id: null },
    { id: 'agent-3', name: 'Agent 3', is_official: false, author_id: 'user-2' },
  ]

  const mockTemplates = [
    { id: 'template-1', name: 'Template 1', is_official: false, author_id: 'user-1' },
    { id: 'template-2', name: 'Template 2', is_official: true, author_id: null },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockShowConfirm.mockResolvedValue(true)
    mockStorage.getItem.mockReturnValue(JSON.stringify(mockAgents))
  })

  describe('String conversion edge cases', () => {
    describe('String(author_id) conversion', () => {
      it('should verify exact String conversion - author_id is number', () => {
        const user = { id: '123', username: 'test' }
        const agents = [
          { id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 123 }, // number
        ]

        const { result } = renderHook(() =>
          useTemplateOperations({
            token: null,
            agents,
            templates: [],
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            activeTab: 'agents',
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://localhost:8000',
            setAgents: mockSetAgents,
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setRepositoryAgents: mockSetRepositoryAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
            setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
          })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should match user.id '123' with author_id 123 (converted to string)
        expect(mockShowConfirm).toHaveBeenCalled()
      })

      it('should verify exact String conversion - author_id is string', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' }, // string
        ]

        const { result } = renderHook(() =>
          useTemplateOperations({
            token: null,
            agents,
            templates: [],
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            activeTab: 'agents',
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://localhost:8000',
            setAgents: mockSetAgents,
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setRepositoryAgents: mockSetRepositoryAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
            setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
          })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should match user.id 'user-1' with author_id 'user-1'
        expect(mockShowConfirm).toHaveBeenCalled()
      })

      it('should verify exact String conversion - author_id is null', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { id: 'agent-1', name: 'Agent 1', is_official: false, author_id: null },
        ]

        const { result } = renderHook(() =>
          useTemplateOperations({
            token: null,
            agents,
            templates: [],
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            activeTab: 'agents',
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://localhost:8000',
            setAgents: mockSetAgents,
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setRepositoryAgents: mockSetRepositoryAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
            setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
          })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should not match (author_id is null)
        expect(mockShowError).toHaveBeenCalled()
      })
    })

    describe('String(user.id) conversion', () => {
      it('should verify exact String conversion - user.id is number', () => {
        const user = { id: 123, username: 'test' } as any
        const agents = [
          { id: 'agent-1', name: 'Agent 1', is_official: false, author_id: '123' },
        ]

        const { result } = renderHook(() =>
          useTemplateOperations({
            token: null,
            agents,
            templates: [],
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            activeTab: 'agents',
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://localhost:8000',
            setAgents: mockSetAgents,
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setRepositoryAgents: mockSetRepositoryAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
            setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
          })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should match user.id 123 (converted to string) with author_id '123'
        expect(mockShowConfirm).toHaveBeenCalled()
      })

      it('should verify exact String conversion - user.id is empty string', () => {
        const user = { id: '', username: 'test' }
        const agents = [
          { id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
          useTemplateOperations({
            token: null,
            agents,
            templates: [],
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            activeTab: 'agents',
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://localhost:8000',
            setAgents: mockSetAgents,
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setRepositoryAgents: mockSetRepositoryAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
            setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
          })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should not match (user.id is empty string)
        expect(mockShowError).toHaveBeenCalled()
      })
    })
  })

  describe('Storage edge cases', () => {
    describe('storage.getItem() return values', () => {
      it('should verify exact null check - storage.getItem returns null', () => {
        const user = { id: 'user-1', username: 'test' }
        mockStorage.getItem.mockReturnValue(null)

        const { result } = renderHook(() =>
          useTemplateOperations({
            agents: mockAgents,
            templates: [],
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            setAgents: jest.fn(),
            setTemplates: jest.fn(),
            setWorkflowsOfWorkflows: jest.fn(),
            setRepositoryAgents: jest.fn(),
            setSelectedAgentIds: jest.fn(),
            setSelectedTemplateIds: jest.fn(),
            setSelectedRepositoryAgentIds: jest.fn(),
            showError: mockShowError,
            showSuccess: mockShowSuccess,
            showConfirm: mockShowConfirm,
          })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should handle null gracefully (no error, just no deletion)
        expect(mockStorage.setItem).not.toHaveBeenCalled()
      })

      it('should verify exact empty string check - storage.getItem returns empty string', () => {
        const user = { id: 'user-1', username: 'test' }
        mockStorage.getItem.mockReturnValue('')

        const { result } = renderHook(() =>
          useTemplateOperations({
            agents: mockAgents,
            templates: [],
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            setAgents: jest.fn(),
            setTemplates: jest.fn(),
            setWorkflowsOfWorkflows: jest.fn(),
            setRepositoryAgents: jest.fn(),
            setSelectedAgentIds: jest.fn(),
            setSelectedTemplateIds: jest.fn(),
            setSelectedRepositoryAgentIds: jest.fn(),
            showError: mockShowError,
            showSuccess: mockShowSuccess,
            showConfirm: mockShowConfirm,
          })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Empty string is falsy, should not proceed
        expect(mockStorage.setItem).not.toHaveBeenCalled()
      })
    })
  })

  describe('Error object structure variations', () => {
    describe('deleteSelectedWorkflows error handling', () => {
      it('should verify error.response - error without response property', async () => {
        const user = { id: 'user-1', username: 'test' }
        mockDeleteTemplate.mockRejectedValue(new Error('Network error'))

        const { result } = renderHook(() =>
          useTemplateOperations({
            agents: [],
            templates: mockTemplates,
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            setAgents: jest.fn(),
            setTemplates: jest.fn(),
            setWorkflowsOfWorkflows: jest.fn(),
            setRepositoryAgents: jest.fn(),
            setSelectedAgentIds: jest.fn(),
            setSelectedTemplateIds: jest.fn(),
            setSelectedRepositoryAgentIds: jest.fn(),
            showError: mockShowError,
            showSuccess: mockShowSuccess,
            showConfirm: mockShowConfirm,
          })
        )

        await act(async () => {
          await result.current.deleteSelectedWorkflows(new Set(['template-1']), 'repository')
        })

        // Should use error.message fallback
        expect(mockShowError).toHaveBeenCalledWith(
          expect.stringContaining('Network error')
        )
      })

      it('should verify error.response.data - response without data property', async () => {
        const user = { id: 'user-1', username: 'test' }
        const error: any = new Error('API error')
        error.response = { status: 500 }
        mockDeleteTemplate.mockRejectedValue(error)

        const { result } = renderHook(() =>
          useTemplateOperations({
            agents: [],
            templates: mockTemplates,
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            setAgents: jest.fn(),
            setTemplates: jest.fn(),
            setWorkflowsOfWorkflows: jest.fn(),
            setRepositoryAgents: jest.fn(),
            setSelectedAgentIds: jest.fn(),
            setSelectedTemplateIds: jest.fn(),
            setSelectedRepositoryAgentIds: jest.fn(),
            showError: mockShowError,
            showSuccess: mockShowSuccess,
            showConfirm: mockShowConfirm,
          })
        )

        await act(async () => {
          await result.current.deleteSelectedWorkflows(new Set(['template-1']), 'repository')
        })

        // Should use error.message fallback
        expect(mockShowError).toHaveBeenCalledWith(
          expect.stringContaining('API error')
        )
      })

      it('should verify error.response.data.detail - data without detail property', async () => {
        const user = { id: 'user-1', username: 'test' }
        const error: any = new Error('API error')
        error.response = { data: { message: 'Error occurred' } }
        mockDeleteTemplate.mockRejectedValue(error)

        const { result } = renderHook(() =>
          useTemplateOperations({
            agents: [],
            templates: mockTemplates,
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            setAgents: jest.fn(),
            setTemplates: jest.fn(),
            setWorkflowsOfWorkflows: jest.fn(),
            setRepositoryAgents: jest.fn(),
            setSelectedAgentIds: jest.fn(),
            setSelectedTemplateIds: jest.fn(),
            setSelectedRepositoryAgentIds: jest.fn(),
            showError: mockShowError,
            showSuccess: mockShowSuccess,
            showConfirm: mockShowConfirm,
          })
        )

        await act(async () => {
          await result.current.deleteSelectedWorkflows(new Set(['template-1']), 'repository')
        })

        // Should use error.message fallback
        expect(mockShowError).toHaveBeenCalledWith(
          expect.stringContaining('API error')
        )
      })

      it('should verify error.response.data.detail - detail is null', async () => {
        const user = { id: 'user-1', username: 'test' }
        const error: any = new Error('API error')
        error.response = { data: { detail: null } }
        mockDeleteTemplate.mockRejectedValue(error)

        const { result } = renderHook(() =>
          useTemplateOperations({
            agents: [],
            templates: mockTemplates,
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            setAgents: jest.fn(),
            setTemplates: jest.fn(),
            setWorkflowsOfWorkflows: jest.fn(),
            setRepositoryAgents: jest.fn(),
            setSelectedAgentIds: jest.fn(),
            setSelectedTemplateIds: jest.fn(),
            setSelectedRepositoryAgentIds: jest.fn(),
            showError: mockShowError,
            showSuccess: mockShowSuccess,
            showConfirm: mockShowConfirm,
          })
        )

        await act(async () => {
          await result.current.deleteSelectedWorkflows(new Set(['template-1']), 'repository')
        })

        // Should use error.message fallback (null detail)
        expect(mockShowError).toHaveBeenCalledWith(
          expect.stringContaining('API error')
        )
      })

      it('should verify error.response.data.detail - detail exists', async () => {
        const user = { id: 'user-1', username: 'test' }
        const error: any = new Error('API error')
        error.response = { data: { detail: 'Template not found' } }
        mockDeleteTemplate.mockRejectedValue(error)

        const { result } = renderHook(() =>
          useTemplateOperations({
            agents: [],
            templates: mockTemplates,
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            setAgents: jest.fn(),
            setTemplates: jest.fn(),
            setWorkflowsOfWorkflows: jest.fn(),
            setRepositoryAgents: jest.fn(),
            setSelectedAgentIds: jest.fn(),
            setSelectedTemplateIds: jest.fn(),
            setSelectedRepositoryAgentIds: jest.fn(),
            showError: mockShowError,
            showSuccess: mockShowSuccess,
            showConfirm: mockShowConfirm,
          })
        )

        await act(async () => {
          await result.current.deleteSelectedWorkflows(new Set(['template-1']), 'repository')
        })

        // Should use error.response.data.detail
        expect(mockShowError).toHaveBeenCalledWith(
          expect.stringContaining('Template not found')
        )
      })
    })
  })

  describe('Boundary conditions', () => {
    describe('officialAgents.length === 0 vs > 0', () => {
      it('should verify exact length check - officialAgents.length === 0', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
          useTemplateOperations({
            token: null,
            agents,
            templates: [],
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            activeTab: 'agents',
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://localhost:8000',
            setAgents: mockSetAgents,
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setRepositoryAgents: mockSetRepositoryAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
            setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
          })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should proceed with deletion (no official agents)
        expect(mockShowConfirm).toHaveBeenCalled()
      })

      it('should verify exact length check - officialAgents.length > 0', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { id: 'agent-1', name: 'Agent 1', is_official: true, author_id: null },
          { id: 'agent-2', name: 'Agent 2', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
          useTemplateOperations({
            token: null,
            agents,
            templates: [],
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            activeTab: 'agents',
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://localhost:8000',
            setAgents: mockSetAgents,
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setRepositoryAgents: mockSetRepositoryAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
            setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
          })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
        })

        // Should show error about official agents
        expect(mockShowError).toHaveBeenCalledWith(
          expect.stringContaining('Cannot delete')
        )
      })
    })

    describe('userOwnedAgents.length === deletableAgents.length', () => {
      it('should verify exact length comparison - equal', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
          { id: 'agent-2', name: 'Agent 2', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
          useTemplateOperations({
            token: null,
            agents,
            templates: [],
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            activeTab: 'agents',
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://localhost:8000',
            setAgents: mockSetAgents,
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setRepositoryAgents: mockSetRepositoryAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
            setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
          })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
        })

        // Should show full delete confirmation (not partial)
        expect(mockShowConfirm).toHaveBeenCalledWith(
          expect.stringContaining('Are you sure'),
          expect.any(Object)
        )
      })

      it('should verify exact length comparison - less than', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
          { id: 'agent-2', name: 'Agent 2', is_official: false, author_id: 'user-2' },
        ]

        const { result } = renderHook(() =>
          useTemplateOperations({
            token: null,
            agents,
            templates: [],
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            activeTab: 'agents',
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://localhost:8000',
            setAgents: mockSetAgents,
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setRepositoryAgents: mockSetRepositoryAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
            setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
          })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1', 'agent-2']))
        })

        // Should show partial delete confirmation
        expect(mockShowConfirm).toHaveBeenCalledWith(
          expect.stringContaining('only delete 1 of 2'),
          expect.any(Object)
        )
      })
    })
  })

  describe('Logical operators', () => {
    describe('user && a.author_id && user.id', () => {
      it('should verify exact AND - all true', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
          useTemplateOperations({
            token: null,
            agents,
            templates: [],
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            activeTab: 'agents',
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://localhost:8000',
            setAgents: mockSetAgents,
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setRepositoryAgents: mockSetRepositoryAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
            setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
          })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should proceed (all conditions true)
        expect(mockShowConfirm).toHaveBeenCalled()
      })

      it('should verify exact AND - user is null', () => {
        const agents = [
          { id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
          useTemplateOperations({
            agents,
            templates: [],
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            user: null,
            storage: mockStorage,
            httpClient: mockHttpClient,
            setAgents: jest.fn(),
            setTemplates: jest.fn(),
            setWorkflowsOfWorkflows: jest.fn(),
            setRepositoryAgents: jest.fn(),
            setSelectedAgentIds: jest.fn(),
            setSelectedTemplateIds: jest.fn(),
            setSelectedRepositoryAgentIds: jest.fn(),
            showError: mockShowError,
            showSuccess: mockShowSuccess,
            showConfirm: mockShowConfirm,
          })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should show error (user is null)
        expect(mockShowError).toHaveBeenCalled()
      })

      it('should verify exact AND - author_id is null', () => {
        const user = { id: 'user-1', username: 'test' }
        const agents = [
          { id: 'agent-1', name: 'Agent 1', is_official: false, author_id: null },
        ]

        const { result } = renderHook(() =>
          useTemplateOperations({
            token: null,
            agents,
            templates: [],
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            activeTab: 'agents',
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://localhost:8000',
            setAgents: mockSetAgents,
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setRepositoryAgents: mockSetRepositoryAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
            setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
          })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should show error (author_id is null)
        expect(mockShowError).toHaveBeenCalled()
      })

      it('should verify exact AND - user.id is empty string', () => {
        const user = { id: '', username: 'test' }
        const agents = [
          { id: 'agent-1', name: 'Agent 1', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
          useTemplateOperations({
            token: null,
            agents,
            templates: [],
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            activeTab: 'agents',
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://localhost:8000',
            setAgents: mockSetAgents,
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setRepositoryAgents: mockSetRepositoryAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
            setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
          })
        )

        act(() => {
          result.current.deleteSelectedAgents(new Set(['agent-1']))
        })

        // Should show error (user.id is empty string, falsy)
        expect(mockShowError).toHaveBeenCalled()
      })
    })

    describe('user && t.author_id', () => {
      it('should verify exact AND - both true', async () => {
        const user = { id: 'user-1', username: 'test' }
        const templates = [
          { id: 'template-1', name: 'Template 1', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
          useTemplateOperations({
            agents: [],
            templates,
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            setAgents: jest.fn(),
            setTemplates: jest.fn(),
            setWorkflowsOfWorkflows: jest.fn(),
            setRepositoryAgents: jest.fn(),
            setSelectedAgentIds: jest.fn(),
            setSelectedTemplateIds: jest.fn(),
            setSelectedRepositoryAgentIds: jest.fn(),
            showError: mockShowError,
            showSuccess: mockShowSuccess,
            showConfirm: mockShowConfirm,
          })
        )

        await act(async () => {
          await result.current.deleteSelectedWorkflows(new Set(['template-1']), 'repository')
        })

        // Should proceed with deletion
        expect(mockDeleteTemplate).toHaveBeenCalled()
      })

      it('should verify exact AND - user is null', async () => {
        const templates = [
          { id: 'template-1', name: 'Template 1', is_official: false, author_id: 'user-1' },
        ]

        const { result } = renderHook(() =>
          useTemplateOperations({
            agents: [],
            templates,
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            user: null,
            storage: mockStorage,
            httpClient: mockHttpClient,
            setAgents: jest.fn(),
            setTemplates: jest.fn(),
            setWorkflowsOfWorkflows: jest.fn(),
            setRepositoryAgents: jest.fn(),
            setSelectedAgentIds: jest.fn(),
            setSelectedTemplateIds: jest.fn(),
            setSelectedRepositoryAgentIds: jest.fn(),
            showError: mockShowError,
            showSuccess: mockShowSuccess,
            showConfirm: mockShowConfirm,
          })
        )

        await act(async () => {
          await result.current.deleteSelectedWorkflows(new Set(['template-1']), 'repository')
        })

        // Should show error (user is null)
        expect(mockShowError).toHaveBeenCalled()
      })

      it('should verify exact AND - author_id is null', async () => {
        const user = { id: 'user-1', username: 'test' }
        const templates = [
          { id: 'template-1', name: 'Template 1', is_official: false, author_id: null },
        ]

        const { result } = renderHook(() =>
          useTemplateOperations({
            agents: [],
            templates,
            workflowsOfWorkflows: [],
            repositoryAgents: [],
            user,
            storage: mockStorage,
            httpClient: mockHttpClient,
            setAgents: jest.fn(),
            setTemplates: jest.fn(),
            setWorkflowsOfWorkflows: jest.fn(),
            setRepositoryAgents: jest.fn(),
            setSelectedAgentIds: jest.fn(),
            setSelectedTemplateIds: jest.fn(),
            setSelectedRepositoryAgentIds: jest.fn(),
            showError: mockShowError,
            showSuccess: mockShowSuccess,
            showConfirm: mockShowConfirm,
          })
        )

        await act(async () => {
          await result.current.deleteSelectedWorkflows(new Set(['template-1']), 'repository')
        })

        // Should show error (author_id is null)
        expect(mockShowError).toHaveBeenCalled()
      })
    })
  })
})
