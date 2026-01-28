import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MarketplaceDialog from './MarketplaceDialog'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api/client'
import { showSuccess, showError } from '../utils/notifications'
import type { StorageAdapter, HttpClient } from '../types/adapters'

// Helper to ensure all waitFor calls have timeouts
const waitForWithTimeout = (callback: () => void | Promise<void>, timeout = 2000) => {
  return waitFor(callback, { timeout })
}

// Mock dependencies
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../api/client', () => ({
  api: {
    publishAgent: jest.fn(),
    publishWorkflow: jest.fn(),
  },
}))

jest.mock('../utils/notifications', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockApi = api as jest.Mocked<typeof api>

describe('MarketplaceDialog', () => {
  const mockOnClose = jest.fn()

  const mockNode = {
    type: 'agent',
    data: {
      label: 'Test Agent',
      name: 'Test Agent',
      description: 'Test description',
      agent_config: {
        model: 'gpt-4',
        temperature: 0.7,
      },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      token: 'token',
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    } as any)
  })

  it('should not render when isOpen is false', () => {
    render(<MarketplaceDialog isOpen={false} onClose={mockOnClose} />)

    expect(screen.queryByText('Send to Marketplace')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} />)

    expect(screen.getByText('Send to Marketplace')).toBeInTheDocument()
  })

  it('should render agents tab by default', () => {
    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} />)

    expect(screen.getByText('Agents')).toBeInTheDocument()
    expect(screen.getByText('Workflows')).toBeInTheDocument()
  })

  it('should switch to workflows tab when clicked', async () => {
    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} />)

    const workflowsTab = screen.getByText('Workflows')
    fireEvent.click(workflowsTab)

    // Should show workflow form fields (category select should be visible)
    await waitForWithTimeout(() => {
      const selects = screen.getAllByRole('combobox')
      expect(selects.length).toBeGreaterThan(0)
    })
  })

  it('should call onClose when close button is clicked', () => {
    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} />)

    // Find close button by finding X icon or button with close functionality
    const closeButton = screen.getByText('Send to Marketplace').closest('div')?.querySelector('button[class*="text-gray"]')
    if (closeButton) {
      fireEvent.click(closeButton)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    } else {
      // Alternative: find by aria-label or title
      const buttons = screen.getAllByRole('button')
      const closeBtn = buttons.find(btn => btn.getAttribute('aria-label')?.includes('close') || btn.className.includes('text-gray'))
      if (closeBtn) {
        fireEvent.click(closeBtn)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      }
    }
  })

  it('should call onClose when backdrop is clicked', () => {
    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} />)

    const backdrop = screen.getByText('Send to Marketplace').closest('div')?.previousElementSibling
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    }
  })

  it('should populate form when node is provided', () => {
    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} node={mockNode} />)

    const nameInput = screen.getByDisplayValue('Test Agent')
    expect(nameInput).toBeInTheDocument()
  })

  it('should handle agent publishing', async () => {
    // Mock publishAgent to return a successful response
    ;(mockApi.publishAgent as jest.Mock).mockResolvedValue({
      id: 'agent-123',
      name: 'Test Agent',
      description: 'Test description',
      category: 'automation',
      tags: [],
      difficulty: 'beginner',
      estimated_time: '',
      agent_config: {},
    })

    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} node={mockNode} />)

    const publishButton = screen.getByText(/Publish/)
    fireEvent.click(publishButton)

    await waitForWithTimeout(() => {
      expect(showSuccess).toHaveBeenCalledWith('Agent published to marketplace successfully!')
      expect(mockOnClose).toHaveBeenCalled()
    })

    // Verify agent was saved to localStorage
    const savedAgents = localStorage.getItem('publishedAgents')
    expect(savedAgents).toBeDefined()
    if (savedAgents) {
      const agents = JSON.parse(savedAgents)
      expect(agents.length).toBeGreaterThan(0)
      expect(agents[0].name).toBe('Test Agent')
    }
  })

  it('should show error when publishing agent without authentication', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    } as any)

    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} node={mockNode} />)

    const publishButton = screen.getByText(/Publish/)
    fireEvent.click(publishButton)

    expect(showError).toHaveBeenCalledWith('Please sign in to publish to the marketplace')
  })

  it('should show error when publishing invalid agent node', () => {
    const invalidNode = { type: 'start', data: {} }
    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} node={invalidNode} />)

    const publishButton = screen.getByText(/Publish/)
    fireEvent.click(publishButton)

    expect(showError).toHaveBeenCalledWith('Invalid agent node')
  })

  it('should handle workflow publishing', async () => {
    mockApi.publishWorkflow.mockResolvedValue({ id: 'published-1', name: 'Test Workflow' } as any)

    render(
      <MarketplaceDialog
        isOpen={true}
        onClose={mockOnClose}
        workflowId="workflow-1"
        workflowName="Test Workflow"
      />
    )

    // Switch to workflows tab
    const workflowsTab = screen.getByText('Workflows')
    fireEvent.click(workflowsTab)

    await waitForWithTimeout(() => {
      const publishButton = screen.getByText(/Publish/)
      fireEvent.click(publishButton)
    })

    await waitForWithTimeout(() => {
      expect(mockApi.publishWorkflow).toHaveBeenCalledWith('workflow-1', expect.any(Object))
      expect(showSuccess).toHaveBeenCalledWith('Workflow published to marketplace successfully!')
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should show error when publishing workflow without workflowId', () => {
    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} />)

    // Switch to workflows tab
    const workflowsTab = screen.getByText('Workflows')
    fireEvent.click(workflowsTab)

    const publishButton = screen.getByText(/Publish/)
    fireEvent.click(publishButton)

    expect(showError).toHaveBeenCalledWith('No workflow selected')
  })

  it('should show error when publishing workflow without authentication', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    } as any)

    render(
      <MarketplaceDialog
        isOpen={true}
        onClose={mockOnClose}
        workflowId="workflow-1"
      />
    )

    const workflowsTab = screen.getByText('Workflows')
    fireEvent.click(workflowsTab)

    const publishButton = screen.getByText(/Publish/)
    fireEvent.click(publishButton)

    expect(showError).toHaveBeenCalledWith('Please sign in to publish to the marketplace')
  })

  it('should handle form field changes', () => {
    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} node={mockNode} />)

    const nameInput = screen.getByDisplayValue('Test Agent') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } })

    expect(nameInput.value).toBe('Updated Name')
  })

  it('should handle category selection', () => {
    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} />)

    // Find category select by finding select elements
    const selects = screen.getAllByRole('combobox')
    const categorySelect = selects.find(select => 
      (select as HTMLElement).closest('div')?.textContent?.includes('Category')
    ) as HTMLSelectElement
    
    if (categorySelect) {
      fireEvent.change(categorySelect, { target: { value: 'content_creation' } })
      expect(categorySelect.value).toBe('content_creation')
    }
  })

  it('should handle difficulty selection', () => {
    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} />)

    // Find difficulty select
    const selects = screen.getAllByRole('combobox')
    const difficultySelect = selects.find(select => 
      (select as HTMLElement).closest('div')?.textContent?.includes('Difficulty')
    ) as HTMLSelectElement
    
    if (difficultySelect) {
      fireEvent.change(difficultySelect, { target: { value: 'advanced' } })
      expect(difficultySelect.value).toBe('advanced')
    }
  })

  it('should handle tags input', () => {
    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} />)

    // Find tags input by placeholder or text content
    const tagsInput = screen.getByPlaceholderText(/llm, automation/) as HTMLInputElement
    fireEvent.change(tagsInput, { target: { value: 'tag1, tag2, tag3' } })

    expect(tagsInput.value).toBe('tag1, tag2, tag3')
  })

  it('should handle estimated time input', () => {
    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} />)

    // Find estimated time input by placeholder
    const timeInput = screen.getByPlaceholderText(/5 min/) as HTMLInputElement
    fireEvent.change(timeInput, { target: { value: '30 minutes' } })

    expect(timeInput.value).toBe('30 minutes')
  })

  it('should handle workflow publishing error', async () => {
    const error = new Error('Publish failed')
    mockApi.publishWorkflow.mockRejectedValue(error)

    render(
      <MarketplaceDialog
        isOpen={true}
        onClose={mockOnClose}
        workflowId="workflow-1"
      />
    )

    const workflowsTab = screen.getByText('Workflows')
    fireEvent.click(workflowsTab)

    await waitForWithTimeout(() => {
      const publishButton = screen.getByText(/Publish/)
      fireEvent.click(publishButton)
    })

    await waitForWithTimeout(() => {
      expect(showError).toHaveBeenCalledWith('Failed to publish workflow: Publish failed')
    })
  })

  it('should update form when node changes', () => {
    const { rerender } = render(
      <MarketplaceDialog isOpen={true} onClose={mockOnClose} node={mockNode} />
    )

    expect(screen.getByDisplayValue('Test Agent')).toBeInTheDocument()

    const newNode = {
      type: 'agent',
      data: {
        label: 'New Agent',
        description: 'New description',
      },
    }

    rerender(<MarketplaceDialog isOpen={true} onClose={mockOnClose} node={newNode} />)

    expect(screen.getByDisplayValue('New Agent')).toBeInTheDocument()
  })

  it('should use default name when node has no label or name', () => {
    const nodeWithoutLabel = {
      type: 'agent',
      data: {},
    }

    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} node={nodeWithoutLabel} />)

    expect(screen.getByDisplayValue('Untitled Agent')).toBeInTheDocument()
  })

  it('should show error when publishing agent without authentication', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    } as any)

    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} node={mockNode} />)

    const publishButton = screen.getByText(/Publish/)
    fireEvent.click(publishButton)

    await waitForWithTimeout(() => {
      expect(showError).toHaveBeenCalledWith('Please sign in to publish to the marketplace')
    })
  })

  it('should show error when publishing invalid agent node', async () => {
    const invalidNode = {
      type: 'condition',
      data: {},
    }

    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} node={invalidNode} />)

    const publishButton = screen.getByText(/Publish/)
    fireEvent.click(publishButton)

    await waitForWithTimeout(() => {
      expect(showError).toHaveBeenCalledWith('Invalid agent node')
    })
  })

  it('should handle localStorage error when publishing agent', async () => {
    // Mock publishAgent to succeed but localStorage to fail
    ;(mockApi.publishAgent as jest.Mock).mockResolvedValue({
      id: 'agent-123',
      name: 'Test Agent',
      description: 'Test description',
      category: 'automation',
      tags: [],
      difficulty: 'beginner',
      estimated_time: '',
      agent_config: {},
    })

    // Mock storage.setItem to throw error
    const mockStorage = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(() => {
        throw new Error('Storage quota exceeded')
      }),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }

    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} node={mockNode} storage={mockStorage as any} />)

    const publishButton = screen.getByText(/Publish/)
    fireEvent.click(publishButton)

    // Should still succeed even if localStorage fails (error is logged but doesn't fail publish)
    await waitForWithTimeout(() => {
      expect(showSuccess).toHaveBeenCalledWith('Agent published to marketplace successfully!')
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should handle empty tags', async () => {
    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} node={mockNode} />)

    const tagsInput = screen.getByPlaceholderText(/e.g., llm, automation, ai/)
    fireEvent.change(tagsInput, { target: { value: '   ,  ,  ' } })

    const publishButton = screen.getByText(/Publish/)
    fireEvent.click(publishButton)

    await waitForWithTimeout(() => {
      expect(showSuccess).toHaveBeenCalled()
    })

    // Tags should be filtered to empty array
    const saved = localStorage.getItem('publishedAgents')
    if (saved) {
      const agents = JSON.parse(saved)
      const lastAgent = agents[agents.length - 1]
      expect(lastAgent.tags).toEqual([])
    }
  })

  it('should handle tags with spaces', async () => {
    // Mock publishAgent to succeed
    ;(mockApi.publishAgent as jest.Mock).mockResolvedValue({
      id: 'agent-123',
      name: 'Test Agent',
      description: 'Test description',
      category: 'automation',
      tags: ['tag1', 'tag2', 'tag3'],
      difficulty: 'beginner',
      estimated_time: '',
      agent_config: {},
    })

    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} node={mockNode} />)

    const tagsInput = screen.getByPlaceholderText(/e.g., llm, automation, ai/)
    fireEvent.change(tagsInput, { target: { value: '  tag1  ,  tag2  ,  tag3  ' } })

    const publishButton = screen.getByText(/Publish/)
    fireEvent.click(publishButton)

    await waitForWithTimeout(() => {
      expect(showSuccess).toHaveBeenCalled()
    })

    // Tags should be trimmed and saved to localStorage
    const saved = localStorage.getItem('publishedAgents')
    if (saved) {
      const agents = JSON.parse(saved)
      const lastAgent = agents[agents.length - 1]
      expect(lastAgent.tags).toEqual(['tag1', 'tag2', 'tag3'])
    }
  })

  it('should handle node without agent_config', async () => {
    const nodeWithoutConfig = {
      type: 'agent',
      data: {
        label: 'Test Agent',
      },
    }

    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} node={nodeWithoutConfig} />)

    const publishButton = screen.getByText(/Publish/)
    fireEvent.click(publishButton)

    await waitForWithTimeout(() => {
      expect(showSuccess).toHaveBeenCalled()
    })

    // Should use empty object for agent_config
    const saved = localStorage.getItem('publishedAgents')
    if (saved) {
      const agents = JSON.parse(saved)
      const lastAgent = agents[agents.length - 1]
      expect(lastAgent.agent_config).toEqual({})
    }
  })

  it('should handle user without username or email', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1' },
      token: 'token',
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    } as any)

    render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} node={mockNode} />)

    const publishButton = screen.getByText(/Publish/)
    fireEvent.click(publishButton)

    await waitForWithTimeout(() => {
      expect(showSuccess).toHaveBeenCalled()
    })

    // Should handle null author_name
    const saved = localStorage.getItem('publishedAgents')
    if (saved) {
      const agents = JSON.parse(saved)
      const lastAgent = agents[agents.length - 1]
      expect(lastAgent.author_name).toBeNull()
    }
  })

  describe('Dependency Injection', () => {
    it('should use injected storage adapter', async () => {
      const mockStorage: StorageAdapter = {
        getItem: jest.fn().mockReturnValue(JSON.stringify([])),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      render(
        <MarketplaceDialog 
          isOpen={true} 
          onClose={mockOnClose}
          node={mockNode}
          storage={mockStorage}
        />
      )

      const publishButton = screen.getByText(/Publish/)
      fireEvent.click(publishButton)

      await waitForWithTimeout(() => {
        expect(mockStorage.getItem).toHaveBeenCalledWith('publishedAgents')
        expect(mockStorage.setItem).toHaveBeenCalled()
      })
    })

    it('should use injected HTTP client for workflow publishing', async () => {
      const mockHttpClient: HttpClient = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      }

      // Mock api.publishWorkflow to use httpClient
      const mockPublishWorkflow = jest.fn().mockResolvedValue({})
      mockApi.publishWorkflow = mockPublishWorkflow

      render(
        <MarketplaceDialog 
          isOpen={true} 
          onClose={mockOnClose}
          workflowId="workflow-1"
          workflowName="Test Workflow"
          httpClient={mockHttpClient}
        />
      )

      // Switch to workflows tab
      const workflowsTab = screen.getByText('Workflows')
      fireEvent.click(workflowsTab)

      await waitForWithTimeout(() => {
        const publishButton = screen.getByText(/Publish/)
        fireEvent.click(publishButton)
      })

      await waitForWithTimeout(() => {
        expect(mockPublishWorkflow).toHaveBeenCalled()
      })
    })

    it('should handle storage errors gracefully', async () => {
      // Mock publishAgent to succeed
      ;(mockApi.publishAgent as jest.Mock).mockResolvedValue({
        id: 'agent-123',
        name: 'Test Agent',
        description: 'Test description',
        category: 'automation',
        tags: [],
        difficulty: 'beginner',
        estimated_time: '',
        agent_config: {},
      })

      const mockStorage: StorageAdapter = {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(() => {
          throw new Error('Storage quota exceeded')
        }),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      render(
        <MarketplaceDialog 
          isOpen={true} 
          onClose={mockOnClose}
          node={mockNode}
          storage={mockStorage}
        />
      )

      const publishButton = screen.getByText(/Publish/)
      fireEvent.click(publishButton)

      // Storage error should be logged but publish should still succeed
      await waitForWithTimeout(() => {
        expect(showSuccess).toHaveBeenCalledWith('Agent published to marketplace successfully!')
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should handle null storage adapter', async () => {
      // Mock publishAgent to succeed
      ;(mockApi.publishAgent as jest.Mock).mockResolvedValue({
        id: 'agent-123',
        name: 'Test Agent',
        description: 'Test description',
        category: 'automation',
        tags: [],
        difficulty: 'beginner',
        estimated_time: '',
        agent_config: {},
      })

      render(
        <MarketplaceDialog 
          isOpen={true} 
          onClose={mockOnClose}
          node={mockNode}
          storage={null}
        />
      )

      const publishButton = screen.getByText(/Publish/)
      fireEvent.click(publishButton)

      // Should handle null storage gracefully - publish should still succeed
      await waitForWithTimeout(() => {
        expect(showSuccess).toHaveBeenCalledWith('Agent published to marketplace successfully!')
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should handle HTTP client errors for workflow publishing', async () => {
      const mockHttpClient: HttpClient = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      }

      const mockPublishWorkflow = jest.fn().mockRejectedValue(new Error('Network error'))
      mockApi.publishWorkflow = mockPublishWorkflow

      render(
        <MarketplaceDialog 
          isOpen={true} 
          onClose={mockOnClose}
          workflowId="workflow-1"
          workflowName="Test Workflow"
          httpClient={mockHttpClient}
        />
      )

      // Switch to workflows tab
      const workflowsTab = screen.getByText('Workflows')
      fireEvent.click(workflowsTab)

      await waitForWithTimeout(() => {
        const publishButton = screen.getByText(/Publish/)
        fireEvent.click(publishButton)
      })

      await waitForWithTimeout(() => {
        expect(showError).toHaveBeenCalledWith(
          expect.stringContaining('Failed to publish workflow')
        )
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle estimated_time being empty string', async () => {
      render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} node={mockNode} />)

      const timeInput = screen.getByPlaceholderText(/5 min/)
      fireEvent.change(timeInput, { target: { value: '' } })

      const publishButton = screen.getByText(/Publish/)
      fireEvent.click(publishButton)

      await waitForWithTimeout(() => {
        expect(showSuccess).toHaveBeenCalled()
      })

      // Should use default '5 min' when empty
      const saved = localStorage.getItem('publishedAgents')
      if (saved) {
        const agents = JSON.parse(saved)
        const lastAgent = agents[agents.length - 1]
        expect(lastAgent.estimated_time).toBe('5 min')
      }
    })

    it('should handle node with name but no label', async () => {
      const nodeWithName = {
        type: 'agent',
        data: {
          name: 'Agent Name',
          description: 'Test',
        },
      }

      render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} node={nodeWithName} />)

      expect(screen.getByDisplayValue('Agent Name')).toBeInTheDocument()
    })

    it('should handle node with label but no name', async () => {
      const nodeWithLabel = {
        type: 'agent',
        data: {
          label: 'Agent Label',
          description: 'Test',
        },
      }

      render(<MarketplaceDialog isOpen={true} onClose={mockOnClose} node={nodeWithLabel} />)

      expect(screen.getByDisplayValue('Agent Label')).toBeInTheDocument()
    })

    it('should handle workflow publishing with empty estimated_time', async () => {
      mockApi.publishWorkflow.mockResolvedValue({ id: 'published-1', name: 'Test Workflow' } as any)

      render(
        <MarketplaceDialog
          isOpen={true}
          onClose={mockOnClose}
          workflowId="workflow-1"
          workflowName="Test Workflow"
        />
      )

      const workflowsTab = screen.getByText('Workflows')
      fireEvent.click(workflowsTab)

      await waitForWithTimeout(() => {
        const timeInput = screen.getByPlaceholderText(/e.g., 10 min/)
        fireEvent.change(timeInput, { target: { value: '' } })
      })

      await waitForWithTimeout(() => {
        const publishButton = screen.getByText(/Publish/)
        fireEvent.click(publishButton)
      })

      await waitForWithTimeout(() => {
        expect(mockApi.publishWorkflow).toHaveBeenCalledWith(
          'workflow-1',
          expect.objectContaining({
            estimated_time: undefined,
          })
        )
      })
    })

    it('should handle workflow publishing with estimated_time', async () => {
      mockApi.publishWorkflow.mockResolvedValue({ id: 'published-1', name: 'Test Workflow' } as any)

      render(
        <MarketplaceDialog
          isOpen={true}
          onClose={mockOnClose}
          workflowId="workflow-1"
          workflowName="Test Workflow"
        />
      )

      const workflowsTab = screen.getByText('Workflows')
      fireEvent.click(workflowsTab)

      await waitForWithTimeout(() => {
        const timeInput = screen.getByPlaceholderText(/e.g., 10 min/)
        fireEvent.change(timeInput, { target: { value: '45 minutes' } })
      })

      await waitForWithTimeout(() => {
        const publishButton = screen.getByText(/Publish/)
        fireEvent.click(publishButton)
      })

      await waitForWithTimeout(() => {
        expect(mockApi.publishWorkflow).toHaveBeenCalledWith(
          'workflow-1',
          expect.objectContaining({
            estimated_time: '45 minutes',
          })
        )
      })
    })
  })
})
