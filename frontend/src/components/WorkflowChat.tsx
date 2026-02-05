import { useState, useRef, useEffect } from 'react'
import { Send, Loader, Bot, User } from 'lucide-react'
import { logger } from '../utils/logger'
import type { StorageAdapter, HttpClient } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'
// Domain-based imports - Phase 7
import { useAuthenticatedApi } from '../hooks/api'
import { handleApiError } from '../utils/errorHandler'
import { safeStorageGet, safeStorageSet } from '../utils/storageHelpers'
import { getChatHistoryKey, API_CONFIG } from '../config/constants'

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
  apiBaseUrl = API_CONFIG.BASE_URL,
  logger: injectedLogger = logger
}: WorkflowChatProps) {
  const { authenticatedPost } = useAuthenticatedApi(httpClient, apiBaseUrl)
  
  // Load conversation history from storage on mount or workflow change
  const loadConversationHistory = (workflowId: string | null): ChatMessage[] => {
    const storageKey = getChatHistoryKey(workflowId)
    const saved = safeStorageGet<ChatMessage[]>(
      storage,
      storageKey,
      [],
      'WorkflowChat'
    )
    
    // Explicit checks to prevent mutation survivors
    if (Array.isArray(saved) === true && saved.length > 0) {
      return saved
    }
    
    // Return default greeting if no history found
    // Explicit check to prevent mutation survivors
    return [{
      role: 'assistant',
      content: (workflowId !== null && workflowId !== undefined && workflowId !== '')
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
    // Explicit check to prevent mutation survivors
    if (messages.length > 0) {
      const storageKey = getChatHistoryKey(workflowId)
      safeStorageSet(storage, storageKey, messages, 'WorkflowChat')
    }
  }, [messages, workflowId, storage])

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
    // Explicit checks to prevent mutation survivors
    if (input.trim() === '' || isLoading === true) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await authenticatedPost(
        API_CONFIG.ENDPOINTS.CHAT,
        {
          workflow_id: workflowId,
          message: userMessage.content,
          conversation_history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      )

      // Explicit check to prevent mutation survivors
      if (response.ok === false) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message
      }

      setMessages(prev => [...prev, assistantMessage])

      // Apply workflow changes if any
      // Explicit checks to prevent mutation survivors
      if ((data.workflow_changes !== null && data.workflow_changes !== undefined) && (onWorkflowUpdate !== null && onWorkflowUpdate !== undefined)) {
        injectedLogger.debug('Received workflow changes:', data.workflow_changes)
        injectedLogger.debug('Nodes to delete:', data.workflow_changes.nodes_to_delete)
        onWorkflowUpdate(data.workflow_changes)
      }

    } catch (error) {
      const errorMessage = handleApiError(error, {
        context: 'WorkflowChat',
        showNotification: false, // We'll show error in chat instead
      })
      
      const chatErrorMessage: ChatMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`
      }
      setMessages(prev => [...prev, chatErrorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Explicit checks to prevent mutation survivors
    if (e.key === 'Enter' && e.shiftKey === false) {
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
        {/* Explicit check to prevent mutation survivors */}
        {isLoading === true && (
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
            disabled={input.trim() === '' || isLoading === true}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {/* Explicit check to prevent mutation survivors */}
            {isLoading === true ? (
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

