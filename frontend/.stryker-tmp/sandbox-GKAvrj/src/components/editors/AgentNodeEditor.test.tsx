// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AgentNodeEditor from './AgentNodeEditor'
import { type NodeWithData } from '../../types/nodeData'

const mockNode: NodeWithData & { type: 'agent' } = {
  id: 'test-agent',
  type: 'agent',
  data: {
    name: 'Test Agent',
    agent_config: {
      model: 'gpt-4',
      system_prompt: 'You are a helpful assistant',
      max_tokens: 1000,
      temperature: 0.7,
    },
  },
  position: { x: 0, y: 0 },
} as NodeWithData & { type: 'agent' }

describe('AgentNodeEditor', () => {
  const mockOnUpdate = vi.fn()
  const mockOnConfigUpdate = vi.fn()
  const availableModels = [
    { value: 'gpt-4', label: 'GPT-4', provider: 'openai' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'openai' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render agent configuration fields', () => {
    render(
      <AgentNodeEditor
        node={mockNode}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    expect(screen.getByLabelText(/model/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/system prompt/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/temperature/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/max tokens/i)).toBeInTheDocument()
  })

  it('should display current model value', () => {
    render(
      <AgentNodeEditor
        node={mockNode}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const modelSelect = screen.getByLabelText(/model/i) as HTMLSelectElement
    expect(modelSelect.value).toBe('gpt-4')
  })

  it('should call onUpdate when model changes', async () => {
    const user = userEvent.setup()
    render(
      <AgentNodeEditor
        node={mockNode}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const modelSelect = screen.getByLabelText(/model/i)
    await user.selectOptions(modelSelect, 'gpt-3.5-turbo')

    expect(mockOnUpdate).toHaveBeenCalledWith('agent_config', expect.objectContaining({
      model: 'gpt-3.5-turbo',
    }))
  })

  it('should call onConfigUpdate when system prompt changes', async () => {
    const user = userEvent.setup()
    render(
      <AgentNodeEditor
        node={mockNode}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const promptTextarea = screen.getByLabelText(/system prompt/i)
    await user.clear(promptTextarea)
    await user.type(promptTextarea, 'New prompt')

    await waitFor(() => {
      expect(mockOnConfigUpdate).toHaveBeenCalledWith('agent_config', 'system_prompt', 'New prompt')
    })
  })

  it('should call onConfigUpdate when max tokens changes', async () => {
    const user = userEvent.setup()
    render(
      <AgentNodeEditor
        node={mockNode}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const maxTokensInput = screen.getByLabelText(/max tokens/i)
    await user.clear(maxTokensInput)
    await user.type(maxTokensInput, '2000')

    await waitFor(() => {
      expect(mockOnConfigUpdate).toHaveBeenCalledWith('agent_config', 'max_tokens', 2000)
    })
  })

  it('should call onUpdate when temperature changes', () => {
    render(
      <AgentNodeEditor
        node={mockNode}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const temperatureSlider = screen.getByLabelText(/temperature/i) as HTMLInputElement
    // Use fireEvent for range inputs
    fireEvent.change(temperatureSlider, { target: { value: '0.9' } })

    expect(mockOnUpdate).toHaveBeenCalledWith('agent_config', expect.objectContaining({
      temperature: 0.9,
    }))
  })

  it('should display default models when availableModels is empty', () => {
    render(
      <AgentNodeEditor
        node={mockNode}
        availableModels={[]}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const modelSelect = screen.getByLabelText(/model/i)
    expect(modelSelect.querySelector('option[value="gpt-4o-mini"]')).toBeInTheDocument()
  })

  it('should display info box about LLM agent', () => {
    render(
      <AgentNodeEditor
        node={mockNode}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    expect(screen.getByText(/This is a Real LLM Agent/i)).toBeInTheDocument()
  })
})

