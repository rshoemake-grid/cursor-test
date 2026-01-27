import { useState, useRef, useEffect } from 'react'
import { Send, Loader, Bot, User } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { logger } from '../utils/logger'
import type { StorageAdapter, HttpClient } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface WorkflowChatProps {
  workflowId: string | null
  onWorkflowUpdate?: (changes: any) => void
  // Dependency injection
  storage?: StorageAdapter | null
  httpClient?: HttpClient
  apiBaseUrl?: string
  logger?: typeof logger
}

export default function WorkflowChat({ 
  workflowId, 
  onWorkflowUpdate,
  storage = defaultAdapters.createLocalStorageAdapter(),
  httpClient = defaultAdapters.createHttpClient(),
  apiBaseUrl = 'http://localhost:8000/api',
  logger: injectedLogger = logger
}: WorkflowChatProps) {
  const { token } = useAuth()
  // Load conversation history from storage on mount or workflow change
  const loadConversationHistory = (workflowId: string | null): ChatMessage[] => {
    if (!storage) {
      // Return default greeting if storage is not available
      return [{
        role: 'assistant',
        content: workflowId 
          ? "Hello! I can help you create or modify this workflow. What would you like to do?"
          : "Hello! I can help you create a new workflow. What would you like to build?"
      }]
    }

    const storageKey = workflowId ? `chat_history_${workflowId}` : 'chat_history_new_workflow'
    try {
      const saved = storage.getItem(storageKey)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
          }
        } catch (e) {
          injectedLogger.error('Failed to load conversation history:', e)
        }
      }
    } catch (e) {
      injectedLogger.error('Failed to load conversation history:', e)
    }
    
    // Return default greeting if no history found
    return [{
      role: 'assistant',
      content: workflowId 
        ? "Hello! I can help you create or modify this workflow. What would you like to do?"
        : "Hello! I can help you create a new workflow. What would you like to build?"
    }]
  }

  const [messages, setMessages] = useState<ChatMessage[]>(() => loadConversationHistory(workflowId))
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Save conversation history to storage whenever messages change
  useEffect(() => {
    if (messages.length > 0 && storage) {
      const storageKey = workflowId ? `chat_history_${workflowId}` : 'chat_history_new_workflow'
      try {
        storage.setItem(storageKey, JSON.stringify(messages))
      } catch (e) {
        injectedLogger.error('Failed to save conversation history:', e)
      }
    }
  }, [messages, workflowId, storage, injectedLogger])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Load conversation history when workflow changes
    const history = loadConversationHistory(workflowId)
    setMessages(history)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]) // Note: loadConversationHistory depends on storage, but we don't want to reload on storage changes

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await httpClient.post(
        `${apiBaseUrl}/workflow-chat/chat`,
        {
          workflow_id: workflowId,
          message: userMessage.content,
          conversation_history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        },
        headers
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message
      }

      setMessages(prev => [...prev, assistantMessage])

      // Apply workflow changes if any
      if (data.workflow_changes && onWorkflowUpdate) {
        injectedLogger.debug('Received workflow changes:', data.workflow_changes)
        injectedLogger.debug('Nodes to delete:', data.workflow_changes.nodes_to_delete)
        onWorkflowUpdate(data.workflow_changes)
      }

    } catch (error) {
      injectedLogger.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-gray-800 rounded-lg px-4 py-2">
              <Loader className="w-5 h-5 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="flex-1 bg-gray-800 text-gray-100 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

