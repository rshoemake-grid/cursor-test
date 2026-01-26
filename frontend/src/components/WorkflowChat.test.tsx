import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WorkflowChat from './WorkflowChat'
import { AuthProvider } from '../contexts/AuthContext'
import { logger } from '../utils/logger'

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  }
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

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    ;(global.fetch as jest.Mock).mockClear()
    
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
    localStorage.setItem('chat_history_workflow-1', 'invalid json')

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    // Should show default greeting
    expect(screen.getByText(/Hello! I can help you/)).toBeInTheDocument()
    expect(logger.error).toHaveBeenCalled()
  })

  it('should send message when send button is clicked', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ message: 'Response message' }),
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/workflow-chat/chat',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          }),
        })
      )
    })
  })

  it('should send message when Enter is pressed', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ message: 'Response message' }),
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  it('should not send message when Shift+Enter is pressed', () => {
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13, shiftKey: true })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should not send empty message', () => {
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const sendButton = screen.getByText('Send')
    expect(sendButton).toBeDisabled()
  })

  it('should display user and assistant messages', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ message: 'Assistant response' }),
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'User message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('User message')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Assistant response')).toBeInTheDocument()
    })
  })

  it('should handle API error', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText(/Sorry, I encountered an error/)).toBeInTheDocument()
    })
  })

  it('should apply workflow changes when received', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        message: 'Response',
        workflow_changes: {
          nodes_to_add: [],
          nodes_to_delete: ['node-1'],
        },
      }),
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    renderWithProvider(<WorkflowChat workflowId="workflow-1" onWorkflowUpdate={mockOnWorkflowUpdate} />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(mockOnWorkflowUpdate).toHaveBeenCalledWith({
        nodes_to_add: [],
        nodes_to_delete: ['node-1'],
      })
    })
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

    await waitFor(() => {
      const saved = localStorage.getItem('chat_history_workflow-1')
      expect(saved).toBeDefined()
      const parsed = JSON.parse(saved!)
      expect(parsed.length).toBeGreaterThan(1)
    })
  })

  it('should load conversation history when workflowId changes', async () => {
    const history1 = [
      { role: 'user' as const, content: 'Message 1' },
    ]
    localStorage.setItem('chat_history_workflow-1', JSON.stringify(history1))

    const { rerender, unmount } = renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    await waitFor(() => {
      expect(screen.getByText('Message 1')).toBeInTheDocument()
    })

    unmount()

    const history2 = [
      { role: 'user' as const, content: 'Message 2' },
    ]
    localStorage.setItem('chat_history_workflow-2', JSON.stringify(history2))

    renderWithProvider(<WorkflowChat workflowId="workflow-2" />)

    await waitFor(() => {
      expect(screen.getByText('Message 2')).toBeInTheDocument()
    }, { timeout: 2000 })
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
    await waitFor(() => {
      expect(screen.queryByText('Send')).not.toBeInTheDocument()
    })

    resolvePromise!({
      ok: true,
      json: async () => ({ message: 'Response' }),
    })

    await waitFor(() => {
      expect(screen.getByText('Send')).toBeInTheDocument()
    })
  })

  it('should handle non-Error exception', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue('String error')

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText(/Unknown error/)).toBeInTheDocument()
    })
  })

  it('should handle empty history array', () => {
    localStorage.setItem('chat_history_workflow-1', JSON.stringify([]))

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    // Should show default greeting
    expect(screen.getByText(/Hello! I can help you/)).toBeInTheDocument()
  })

  it('should not call onWorkflowUpdate when workflow_changes is missing', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ message: 'Response' }),
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    renderWithProvider(<WorkflowChat workflowId="workflow-1" onWorkflowUpdate={mockOnWorkflowUpdate} />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Response')).toBeInTheDocument()
    })

    expect(mockOnWorkflowUpdate).not.toHaveBeenCalled()
  })

  it('should handle fetch rejection', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument()
    })
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
    ;(global.fetch as jest.Mock).mockReturnValue(promise)

    renderWithProvider(<WorkflowChat workflowId="workflow-1" />)

    const input = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(input, { target: { value: 'Test message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    // Try to send again while loading
    await waitFor(() => {
      expect(screen.queryByText('Send')).not.toBeInTheDocument()
    })

    // Input should be disabled or send button should not exist
    fireEvent.change(input, { target: { value: 'Another message' } })
    // Should not trigger another send

    resolvePromise!({
      ok: true,
      json: async () => ({ message: 'Response' }),
    })
  })
})
