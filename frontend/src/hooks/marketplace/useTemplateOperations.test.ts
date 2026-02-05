import { renderHook } from '@testing-library/react'
import { useTemplateOperations } from './useTemplateOperations'
import { useTemplateUsage } from './useTemplateUsage'
import { useAgentDeletion, useRepositoryAgentDeletion } from './useAgentDeletion'
import { useWorkflowDeletion } from '../workflow'

// Mock the composed hooks
jest.mock('./useTemplateUsage')
jest.mock('./useAgentDeletion')
jest.mock('../workflow', () => ({
  useWorkflowDeletion: jest.fn(),
}))

const mockUseTemplateUsage = useTemplateUsage as jest.MockedFunction<typeof useTemplateUsage>
const mockUseAgentDeletion = useAgentDeletion as jest.MockedFunction<typeof useAgentDeletion>
const mockUseRepositoryAgentDeletion = useRepositoryAgentDeletion as jest.MockedFunction<typeof useRepositoryAgentDeletion>
const mockUseWorkflowDeletion = useWorkflowDeletion as jest.MockedFunction<typeof useWorkflowDeletion>

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
    
    // Setup mock return values for composed hooks
    mockUseTemplateUsage.mockReturnValue({
      useTemplate: jest.fn(),
    })
    
    mockUseAgentDeletion.mockReturnValue({
      deleteSelectedAgents: jest.fn(),
    })
    
    mockUseRepositoryAgentDeletion.mockReturnValue({
      deleteSelectedRepositoryAgents: jest.fn(),
    })
    
    mockUseWorkflowDeletion.mockReturnValue({
      deleteSelectedWorkflows: jest.fn(),
    })
  })

  it('should compose useTemplateUsage hook', () => {
    renderHook(() =>
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

    expect(mockUseTemplateUsage).toHaveBeenCalledWith({
      token: 'token-123',
      httpClient: mockHttpClient,
      apiBaseUrl: 'http://api.test',
    })
  })

  it('should compose useAgentDeletion hook', () => {
    renderHook(() =>
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

    expect(mockUseAgentDeletion).toHaveBeenCalledWith({
      user: { id: 'user-1', username: 'testuser' },
      storage: mockStorage,
      agents: mockAgents,
      setAgents: mockSetAgents,
      setSelectedAgentIds: mockSetSelectedAgentIds,
    })
  })

  it('should compose useWorkflowDeletion hook', () => {
    renderHook(() =>
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

    expect(mockUseWorkflowDeletion).toHaveBeenCalledWith({
      user: { id: 'user-1', username: 'testuser' },
      templates: mockTemplates,
      workflowsOfWorkflows: [],
      activeTab: 'repository',
      setTemplates: mockSetTemplates,
      setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
      setSelectedTemplateIds: mockSetSelectedTemplateIds,
    })
  })

  it('should compose useRepositoryAgentDeletion hook', () => {
    renderHook(() =>
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

    expect(mockUseRepositoryAgentDeletion).toHaveBeenCalledWith({
      storage: mockStorage,
      setRepositoryAgents: mockSetRepositoryAgents,
      setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds,
    })
  })

  it('should return composed hook functions', () => {
    const mockUseTemplate = jest.fn()
    const mockDeleteAgents = jest.fn()
    const mockDeleteWorkflows = jest.fn()
    const mockDeleteRepositoryAgents = jest.fn()

    mockUseTemplateUsage.mockReturnValue({
      useTemplate: mockUseTemplate,
    })
    mockUseAgentDeletion.mockReturnValue({
      deleteSelectedAgents: mockDeleteAgents,
    })
    mockUseWorkflowDeletion.mockReturnValue({
      deleteSelectedWorkflows: mockDeleteWorkflows,
    })
    mockUseRepositoryAgentDeletion.mockReturnValue({
      deleteSelectedRepositoryAgents: mockDeleteRepositoryAgents,
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

    expect(result.current.useTemplate).toBe(mockUseTemplate)
    expect(result.current.deleteSelectedAgents).toBe(mockDeleteAgents)
    expect(result.current.deleteSelectedWorkflows).toBe(mockDeleteWorkflows)
    expect(result.current.deleteSelectedRepositoryAgents).toBe(mockDeleteRepositoryAgents)
  })
})
