/**
 * Agent Node Editor Component
 * Handles editing of LLM agent node properties
 * Follows Single Responsibility Principle
 */

import { useRef, useState, useEffect } from 'react'
import { NodeWithData } from '../../types/nodeData'

interface AgentNodeEditorProps {
  node: NodeWithData & { type: 'agent' }
  availableModels: Array<{ value: string; label: string; provider: string }>
  onUpdate: (field: string, value: unknown) => void
  onConfigUpdate: (configField: string, field: string, value: unknown) => void
}

export default function AgentNodeEditor({
  node,
  availableModels,
  onUpdate,
  onConfigUpdate
}: AgentNodeEditorProps) {
  const systemPromptRef = useRef<HTMLTextAreaElement>(null)
  const maxTokensRef = useRef<HTMLInputElement>(null)
  
  const [systemPromptValue, setSystemPromptValue] = useState('')
  const [maxTokensValue, setMaxTokensValue] = useState<string | number>('')

  // Sync local state with node data
  useEffect(() => {
    const agentConfig = node.data.agent_config || {}
    
    if (document.activeElement !== systemPromptRef.current) {
      setSystemPromptValue(agentConfig.system_prompt || '')
    }
    if (document.activeElement !== maxTokensRef.current) {
      setMaxTokensValue(agentConfig.max_tokens || '')
    }
  }, [node.data.agent_config])

  const agentConfig = node.data.agent_config || {}
  const currentModel = agentConfig.model || (availableModels.length > 0 ? availableModels[0].value : 'gpt-4o-mini')

  return (
    <div className="border-t pt-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">LLM Agent Configuration</h4>
      
      {/* Model Selection */}
      <div>
        <label 
          htmlFor="agent-model"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Model
        </label>
        <select
          id="agent-model"
          value={currentModel}
          onChange={(e) =>
            onUpdate('agent_config', {
              ...agentConfig,
              model: e.target.value,
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="Select LLM model for agent"
        >
          {availableModels.length > 0 ? (
            availableModels.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))
          ) : (
            <>
              <option value="gpt-4o-mini">GPT-4o Mini (OpenAI)</option>
              <option value="gpt-4o">GPT-4o (OpenAI)</option>
              <option value="gpt-4">GPT-4 (OpenAI)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (OpenAI)</option>
            </>
          )}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {availableModels.length > 0 
            ? `This agent will use the configured LLM provider with the selected model`
            : 'This agent will call the OpenAI API with this model. Configure providers in Settings.'}
        </p>
      </div>

      {/* System Prompt */}
      <div className="mt-4">
        <label 
          htmlFor="agent-system-prompt"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          System Prompt
        </label>
        <textarea
          id="agent-system-prompt"
          ref={systemPromptRef}
          value={systemPromptValue}
          onChange={(e) => {
            const newValue = e.target.value
            setSystemPromptValue(newValue)
            onConfigUpdate('agent_config', 'system_prompt', newValue)
          }}
          rows={4}
          placeholder="You are a helpful assistant that..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="System prompt for agent behavior"
          aria-describedby="system-prompt-help"
        />
        <p id="system-prompt-help" className="text-xs text-gray-500 mt-1">
          Instructions that define the agent's role and behavior
        </p>
      </div>

      {/* Temperature */}
      <div className="mt-4">
        <label 
          htmlFor="agent-temperature"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Temperature: {agentConfig.temperature?.toFixed(1) || '0.7'}
        </label>
        <input
          id="agent-temperature"
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={agentConfig.temperature || 0.7}
          onChange={(e) =>
            onUpdate('agent_config', {
              ...agentConfig,
              temperature: parseFloat(e.target.value),
            })
          }
          className="w-full"
          aria-label="Temperature control for agent creativity"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={agentConfig.temperature || 0.7}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Focused (0.0)</span>
          <span>Creative (1.0)</span>
        </div>
      </div>

      {/* Max Tokens */}
      <div className="mt-4">
        <label 
          htmlFor="agent-max-tokens"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Max Tokens (optional)
        </label>
        <input
          id="agent-max-tokens"
          ref={maxTokensRef}
          type="number"
          value={maxTokensValue}
          onChange={(e) => {
            const newValue = e.target.value ? parseInt(e.target.value) : undefined
            setMaxTokensValue(e.target.value)
            onConfigUpdate('agent_config', 'max_tokens', newValue)
          }}
          placeholder="Leave blank for default"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="Maximum tokens for agent response"
          aria-describedby="max-tokens-help"
        />
        <p id="max-tokens-help" className="text-xs text-gray-500 mt-1">
          Maximum length of the agent's response
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4" role="status">
        <p className="text-xs text-blue-900 font-medium mb-1">🤖 This is a Real LLM Agent</p>
        <p className="text-xs text-blue-700">
          When executed, this agent will call OpenAI's API with your configured model and prompt.
          The agent receives data from its inputs and produces output for the next nodes.
        </p>
      </div>
    </div>
  )
}

