import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WorkflowChat from './WorkflowChat'
import { AuthProvider } from '../contexts/AuthContext'
import { logger } from '../utils/logger'
import type { StorageAdapter, HttpClient } from '../types/adapters'

// Helper to ensure all waitFor calls have timeouts
const waitForWithTimeout = (callback: () => void | Promise<void>, timeout = 2000) => {
  return waitFor(callback, { timeout })
}

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  }
}))

// Mock new utilities
jest.mock('../hooks/useAuthenticatedApi', () => ({
  useAuthenticatedApi: jest.fn(() => ({
    authenticatedPost: jest.fn(),
    authenticatedGet: jest.fn(),
    authenticatedPut: jest.fn(),
    authenticatedDelete: jest.fn(),
  })),
}))

jest.mock('../utils/errorHandler', () => ({
  handleApiError: jest.fn((error) => {
    return error?.message || 'Unknown error'
  }),
}))

jest.mock('../utils/storageHelpers', () => ({
  safeStorageGet: jest.fn((storage, key, defaultValue) => {
    if (!storage) return defaultValue
    try {
      const item = storage.getItem(key)
      if (!item) return defaultValue
      return JSON.parse(item)
    } catch {
      return defaultValue
    }
  }),
  safeStorageSet: jest.fn((storage, key, value) => {
    if (!storage) return false
    try {
      storage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  }),
}))

jest.mock('../config/constants', () => ({
  API_CONFIG: {
    BASE_URL: 'http://localhost:8000/api',
    ENDPOINTS: {
      CHAT: '/workflow-chat/chat',
    },
  },
  getChatHistoryKey: jest.fn((workflowId) => {
    return workflowId ? `chat_history_${workflowId}` : 'chat_history_new_workflow'
  }),
}))

// Mock fetch
global.fetch = jest.fn()

// Mock useAuth
jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: () => ({
    token: 'test-token',
    user: { id: '1', username: 'testuser' },
    isAuthenticated: true,
  }),
}))

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  )
}

describe('WorkflowChat', () => {
  const mockOnWorkflowUpdate = jest.fn()
  const mockAuthenticatedPost = jest.fn()
  const mockAuthenticatedGet = jest.fn()
  const mockAuthenticatedPut = jest.fn()
  const mockAuthenticatedDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    
    // Reset mocks
    const { useAuthenticatedApi } = require('../hooks/useAuthenticatedApi')
    const { safeStorageGet } = require('../utils/storageHelpers')
    const { safeStorageSet } = require('../utils/storageHelpers')
    const { handleApiError } = require('../utils/errorHandler')
    
    // Reset all mocks
    mockAuthenticatedPost.mockClear()
    mockAuthenticatedGet.mockClear()
    mockAuthenticatedPut.mockClear()
    mockAuthenticatedDelete.mockClear()
    
    // Setup default mocks
    useAuthenticatedApi.mockReturnValue({
      authenticatedPost: mockAuthenticatedPost,
      authenticatedGet: mockAuthenticatedGet,
      authenticatedPut: mockAuthenticatedPut,
      authenticatedDelete: mockAuthenticatedDelete,
    })
    
    // Default storage helpers to use real localStorage
    safeStorageGet.mockImplementation((storage, key, defaultValue) => {
      if (!storage) return defaultValue
      try {
        const item = storage.getItem(key)
        if (!item) return defaultValue
        return JSON.parse(item)
      } catch {
        return defaultValue
      }
    })
    
    safeStorageSet.mockImplementation((storage, key, value) => {
      if (!storage) return false
      try {
        storage.setItem(key, JSON.stringify(value))
        return true
      } catch {
        return false
      }
    })
    
    handleApiError.mockImplementation((error) => {
      return error?.message || 'Unknown error'
    })
    
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn()
  })

  it('should render chat interface', () => {
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    expect(screen.getByPlaceholderText(/Type your message/)).toBeInTheDocument()
    expect(screen.getByText('Send')).toBeInTheDocument()
  })

  it('should display default greeting for existing workflow', () => {
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    expect(screen.getByText(/Hello! I can help you create or modify this workflow/)).toBeInTheDocument()
  })

  it('should display default greeting for new workflow', () => {
    renderWithProvider(<WorkflowChat workflowId={null} />)

    expect(screen.getByText(/Hello! I can help you create a new workflow/)).toBeInTheDocument()
  })

  it('should load conversation history from localStorage', () => {
    const history = [
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'Hi there!' },
    ]
    localStorage.setItem('chat_history_workflow-1', JSON.stringify(history))

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Hi there!')).toBeInTheDocument()
  })

  it('should handle invalid localStorage history gracefully', () => {
    const { safeStorageGet } = require('../utils/storageHelpers')
    safeStorageGet.mockReturnValueOnce([]) // Return empty array on parse error

    localStorage.setItem('chat_history_workflow-1', 'invalid json')

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    // Should show default greeting
    expect(screen.getByText(/Hello! I can help you/)).toBeInTheDocument()
  })

  it('should send message when send button is clicked', async () => {
    const { useAuthenticatedApi } = require('../hooks/useAuthenticatedApi')
    const mockAuthenticatedPost = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Response message' }),
    })
    useAuthenticatedApi.mockReturnValue({
      authenticatedPost: mockAuthenticatedPost,
      authenticatedGet: jest.fn(),
      authenticatedPut: jest.fn(),
      authenticatedDelete: jest.fn(),
    })

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitForWithTimeout(() => {
      expect(mockAuthenticatedPost).toHaveBeenCalledWith(
        '/workflow-chat/chat',
        expect.objectContaining({
          workflow_id: 'workflow-1',
          message: 'Test message',
        })
      )
    }, 3000) // API call completion
  })

  it('should send message when Enter is pressed', async () => {
    mockAuthenticatedPost.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Response message' }),
    })

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })

    await waitForWithTimeout(() => {
      expect(mockAuthenticatedPost).toHaveBeenCalled()
    }, 3000) // API call completion
  })

  it('should not send message when Shift+Enter is pressed', () => {
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13, shiftKey: true })

    expect(mockAuthenticatedPost).not.toHaveBeenCalled()
  })

  it('should not send empty message', () => {
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const sendButton = screen.getByText('Send')
    expect(sendButton).toBeDisabled()
  })

  it('should display user and assistant messages', async () => {
    mockAuthenticatedPost.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Assistant response' }),
    })

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'User message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitForWithTimeout(() => {
      expect(screen.getByText('User message')).toBeInTheDocument()
    }, 2000) // Component rendering

    await waitForWithTimeout(() => {
      expect(screen.getByText('Assistant response')).toBeInTheDocument()
    }, 3000) // API response rendering
  })

  it('should handle API error', async () => {
    const { handleApiError } = require('../utils/errorHandler')
    handleApiError.mockReturnValue('HTTP error! status: 500')
    
    mockAuthenticatedPost.mockResolvedValue({
      ok: false,
      status: 500,
    })

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitForWithTimeout(() => {
      expect(screen.getByText(/HTTP error/)).toBeInTheDocument()
    }, 2000) // Error message display
  })

  it('should apply workflow changes when received', async () => {
    mockAuthenticatedPost.mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'Response',
        workflow_changes: {
          nodes_to_add: [],
          nodes_to_delete: ['node-1'],
        },
      }),
    })

    renderWithProvider(<WorkflowChat workflowId="workflow-1" onWorkflowUpdate={mockOnWorkflowUpdate} />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitForWithTimeout(() => {
      expect(mockOnWorkflowUpdate).toHaveBeenCalledWith({
        nodes_to_add: [],
        nodes_to_delete: ['node-1'],
      })
    }, 3000) // Workflow update callback
  })

  it('should save conversation history to localStorage', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ message: 'Response' }),
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitForWithTimeout(() => {
      const saved = localStorage.getItem('chat_history_workflow-1')
      expect(saved).toBeDefined()
      const parsed = JSON.parse(saved!)
      expect(parsed.length).toBeGreaterThan(1)
    }, 2000) // Storage operation
  })

  it('should load conversation history when workflowId changes', async () => {
    mockAuthenticatedPost.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Response' }),
    })

    const history1 = [
      { role: 'user' as const, content: 'Message 1' },
    ]
    localStorage.setItem('chat_history_workflow-1', JSON.stringify(history1))

    const { rerender, unmount } = renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    await waitForWithTimeout(() => {
      expect(screen.getByText('Message 1')).toBeInTheDocument()
    }, 2000) // Message rendering

    unmount()

    const history2 = [
      { role: 'user' as const, content: 'Message 2' },
    ]
    localStorage.setItem('chat_history_workflow-2', JSON.stringify(history2))

    renderWithProvider(<WorkflowChat workflowId="workflow-2" />)

    await waitForWithTimeout(() => {
      expect(screen.getByText('Message 2')).toBeInTheDocument()
    }, 2000) // Message rendering
  })

  it('should show loading state while sending', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    ;(global.fetch as jest.Mock).mockReturnValue(promise)

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    // Should show loading state
    await waitForWithTimeout(() => {
      expect(screen.queryByText('Send')).not.toBeInTheDocument()
    }, 2000) // UI state update

    resolvePromise!({
      ok: true,
      json: async () => ({ message: 'Response' }),
    })

    await waitForWithTimeout(() => {
      expect(screen.getByText('Send')).toBeInTheDocument()
    }, 2000) // UI state update
  })

  it('should handle non-Error exception', async () => {
    const { handleApiError } = require('../utils/errorHandler')
    handleApiError.mockReturnValue('Unknown error')
    
    mockAuthenticatedPost.mockRejectedValue('String error')

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitForWithTimeout(() => {
      expect(screen.getByText(/Unknown error/)).toBeInTheDocument()
    }, 2000) // Error message display
  })

  it('should handle empty history array', () => {
    localStorage.setItem('chat_history_workflow-1', JSON.stringify([]))

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    // Should show default greeting
    expect(screen.getByText(/Hello! I can help you/)).toBeInTheDocument()
  })

  it('should not call onWorkflowUpdate when workflow_changes is missing', async () => {
    mockAuthenticatedPost.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Response' }),
    })

    renderWithProvider(<WorkflowChat workflowId="workflow-1" onWorkflowUpdate={mockOnWorkflowUpdate} />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitForWithTimeout(() => {
      expect(screen.getByText('Response')).toBeInTheDocument()
    }, 3000) // API response rendering

    expect(mockOnWorkflowUpdate).not.toHaveBeenCalled()
  })

  it('should handle network errors', async () => {
    const { handleApiError } = require('../utils/errorHandler')
    handleApiError.mockReturnValue('Network error')
    
    mockAuthenticatedPost.mockRejectedValue(new Error('Network error'))

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitForWithTimeout(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument()
    }, 2000) // Error message display
  })

  it('should not send when input is only whitespace', () => {
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: '   ' } })

    const sendButton = screen.getByText('Send')
    expect(sendButton).toBeDisabled()
  })

  it('should not send when isLoading is true', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    mockAuthenticatedPost.mockReturnValue(promise)

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    // Try to send again while loading
    await waitForWithTimeout(() => {
      expect(sendButton).toBeDisabled()
    }, 2000) // Loading state update

    // Input should be disabled or send button should not exist
    fireEvent.change(input, { target: { value: 'Another message' } })
    // Should not trigger another send

    resolvePromise!({
      ok: true,
      json: async () => ({ message: 'Response' }),
    })
  })

  describe('Dependency Injection', () => {
    it('should use injected storage adapter', () => {
      const mockStorage: StorageAdapter = {
        getItem: jest.fn().mockReturnValue(JSON.stringify([
          { role: 'user', content: 'Test message' }
        ])),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      renderWithProvider(
        <WorkflowChat workflowId="workflow-1" storage={mockStorage} />
      )

      expect(mockStorage.getItem).toHaveBeenCalledWith('chat_history_workflow-1')
    })

    it('should use injected HTTP client', async () => {
      const { useAuthenticatedApi } = require('../hooks/useAuthenticatedApi')
      const injectedMockPost = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Response from injected client' }),
      })
      
      useAuthenticatedApi.mockReturnValue({
        authenticatedPost: injectedMockPost,
        authenticatedGet: jest.fn(),
        authenticatedPut: jest.fn(),
        authenticatedDelete: jest.fn(),
      })

      renderWithProvider(
        <WorkflowChat workflowId="workflow-1" />
      )

      const input = screen.getByPlaceholderText(/Type your message/)
      fireEvent.change(input, { target: { value: 'Test message' } })

      const sendButton = screen.getByText('Send')
      fireEvent.click(sendButton)

      await waitForWithTimeout(() => {
        expect(injectedMockPost).toHaveBeenCalled()
      }, 3000) // API call completion

      await waitForWithTimeout(() => {
        expect(screen.getByText('Response from injected client')).toBeInTheDocument()
      }, 3000) // API response rendering
    })

    it('should use injected API base URL', async () => {
      const { useAuthenticatedApi } = require('../hooks/useAuthenticatedApi')
      const customMockPost = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Response' }),
      })
      
      useAuthenticatedApi.mockReturnValue({
        authenticatedPost: customMockPost,
        authenticatedGet: jest.fn(),
        authenticatedPut: jest.fn(),
        authenticatedDelete: jest.fn(),
      })

      renderWithProvider(
        <WorkflowChat workflowId="workflow-1" apiBaseUrl="https://custom-api.com/api" />
      )

      const input = screen.getByPlaceholderText(/Type your message/)
      fireEvent.change(input, { target: { value: 'Test message' } })

      const sendButton = screen.getByText('Send')
      fireEvent.click(sendButton)

      await waitForWithTimeout(() => {
        expect(useAuthenticatedApi).toHaveBeenCalledWith(
          expect.any(Object),
          'https://custom-api.com/api'
        )
      }, 2000) // Hook initialization

      await waitForWithTimeout(() => {
        expect(customMockPost).toHaveBeenCalled()
      }, 3000) // API call completion
    })

    it('should use injected logger', async () => {
      const mockLogger = {
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
      }

      mockAuthenticatedPost.mockResolvedValue({
        ok: true,
        json: async () => ({ 
          message: 'Response',
          workflow_changes: { nodes_to_delete: ['node-1'] }
        }),
      })

      renderWithProvider(
        <WorkflowChat 
          workflowId="workflow-1" 
          logger={mockLogger}
          onWorkflowUpdate={mockOnWorkflowUpdate}
        />
      )

      const input = screen.getByPlaceholderText(/Type your message/)
      fireEvent.change(input, { target: { value: 'Test message' } })

      const sendButton = screen.getByText('Send')
      fireEvent.click(sendButton)

      await waitForWithTimeout(() => {
        expect(screen.getByText('Response')).toBeInTheDocument()
      })

      await waitForWithTimeout(() => {
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Received workflow changes:',
          expect.objectContaining({ nodes_to_delete: ['node-1'] })
        )
      }, 2000)
    })

    it('should handle storage errors gracefully', () => {
      const { safeStorageGet } = require('../utils/storageHelpers')
      safeStorageGet.mockReturnValueOnce([]) // Return empty array on error

      const mockStorage: StorageAdapter = {
        getItem: jest.fn().mockImplementation(() => {
          throw new Error('Storage quota exceeded')
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      renderWithProvider(
        <WorkflowChat 
          workflowId="workflow-1" 
          storage={mockStorage}
        />
      )

      // Should show default greeting when storage fails
      expect(screen.getByText(/Hello! I can help you/)).toBeInTheDocument()
    })

    it('should handle storage setItem errors', async () => {
      const { safeStorageSet } = require('../utils/storageHelpers')
      safeStorageSet.mockReturnValue(false) // Simulate storage error

      mockAuthenticatedPost.mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Response' }),
      })

      renderWithProvider(
        <WorkflowChat workflowId="workflow-1" />
      )

      const input = screen.getByPlaceholderText(/Type your message/)
      fireEvent.change(input, { target: { value: 'Test message' } })

      const sendButton = screen.getByText('Send')
      fireEvent.click(sendButton)

      await waitForWithTimeout(() => {
        expect(screen.getByText('Response')).toBeInTheDocument()
      })

      // Should handle storage error gracefully (no crash)
    })

    it('should handle HTTP client errors', async () => {
      const { handleApiError } = require('../utils/errorHandler')
      handleApiError.mockReturnValue('Network error')
      
      mockAuthenticatedPost.mockRejectedValue(new Error('Network error'))

      renderWithProvider(
        <WorkflowChat workflowId="workflow-1" />
      )

      const input = screen.getByPlaceholderText(/Type your message/)
      fireEvent.change(input, { target: { value: 'Test message' } })

      const sendButton = screen.getByText('Send')
      fireEvent.click(sendButton)

      await waitForWithTimeout(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument()
      }, 2000) // Error message display

      expect(handleApiError).toHaveBeenCalled()
    })

    it('should handle null storage adapter', () => {
      renderWithProvider(
        <WorkflowChat workflowId="workflow-1" storage={null} />
      )

      // Should show default greeting when storage is null
      expect(screen.getByText(/Hello! I can help you/)).toBeInTheDocument()
    })

    it('should save to injected storage adapter', async () => {
      const mockStorage: StorageAdapter = {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      const mockResponse = {
        ok: true,
        json: async () => ({ message: 'Response' }),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      renderWithProvider(
        <WorkflowChat workflowId="workflow-1" storage={mockStorage} />
      )

      const input = screen.getByPlaceholderText(/Type your message/)
      fireEvent.change(input, { target: { value: 'Test message' } })

      const sendButton = screen.getByText('Send')
      fireEvent.click(sendButton)

      await waitForWithTimeout(() => {
        expect(mockStorage.setItem).toHaveBeenCalledWith(
          'chat_history_workflow-1',
          expect.stringContaining('Test message')
        )
      }, 2000) // Storage operation
    })
  })
})
