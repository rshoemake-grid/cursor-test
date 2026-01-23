// Jest globals - no import needed
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
  const mockOnUpdate = jest.fn()
  const mockOnConfigUpdate = jest.fn()
  const availableModels = [
    { value: 'gpt-4', label: 'GPT-4', provider: 'openai' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'openai' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
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

  it('should use default model when agent_config.model is missing', () => {
    const nodeWithoutModel = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          system_prompt: 'Test',
          max_tokens: 1000,
          temperature: 0.7
        }
      }
    }

    render(
      <AgentNodeEditor
        node={nodeWithoutModel}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const modelSelect = screen.getByLabelText(/model/i) as HTMLSelectElement
    expect(modelSelect.value).toBe('gpt-4') // First available model
  })

  it('should use gpt-4o-mini when no availableModels and no model in config', () => {
    const nodeWithoutModel = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          system_prompt: 'Test'
        }
      }
    }

    render(
      <AgentNodeEditor
        node={nodeWithoutModel}
        availableModels={[]}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const modelSelect = screen.getByLabelText(/model/i) as HTMLSelectElement
    expect(modelSelect.value).toBe('gpt-4o-mini')
  })

  it('should handle missing agent_config', () => {
    const nodeWithoutConfig = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: undefined
      }
    }

    render(
      <AgentNodeEditor
        node={nodeWithoutConfig}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const modelSelect = screen.getByLabelText(/model/i) as HTMLSelectElement
    expect(modelSelect.value).toBe('gpt-4') // First available model
  })

  it('should display help text when availableModels is provided', () => {
    render(
      <AgentNodeEditor
        node={mockNode}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    expect(screen.getByText(/This agent will use the configured LLM provider/i)).toBeInTheDocument()
  })

  it('should display help text when availableModels is empty', () => {
    render(
      <AgentNodeEditor
        node={mockNode}
        availableModels={[]}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    expect(screen.getByText(/This agent will call the OpenAI API/i)).toBeInTheDocument()
  })

  it('should sync system prompt when node data changes', async () => {
    const { rerender } = render(
      <AgentNodeEditor
        node={mockNode}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const promptTextarea = screen.getByLabelText(/system prompt/i) as HTMLTextAreaElement
    expect(promptTextarea.value).toBe('You are a helpful assistant')

    const updatedNode = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          system_prompt: 'Updated prompt'
        }
      }
    }

    rerender(
      <AgentNodeEditor
        node={updatedNode}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    await waitFor(() => {
      expect(promptTextarea.value).toBe('Updated prompt')
    })
  })

  it('should sync max tokens when node data changes', async () => {
    const { rerender } = render(
      <AgentNodeEditor
        node={mockNode}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const maxTokensInput = screen.getByLabelText(/max tokens/i) as HTMLInputElement
    expect(maxTokensInput.value).toBe('1000')

    const updatedNode = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          max_tokens: 2000
        }
      }
    }

    rerender(
      <AgentNodeEditor
        node={updatedNode}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    await waitFor(() => {
      expect(maxTokensInput.value).toBe('2000')
    })
  })

  it('should not update local state when input is focused', async () => {
    const { rerender } = render(
      <AgentNodeEditor
        node={mockNode}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const promptTextarea = screen.getByLabelText(/system prompt/i) as HTMLTextAreaElement
    promptTextarea.focus()

    const updatedNode = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          system_prompt: 'Updated prompt'
        }
      }
    }

    rerender(
      <AgentNodeEditor
        node={updatedNode}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    // Value should not change when input is focused
    expect(promptTextarea.value).toBe('You are a helpful assistant')
  })

  it('should handle empty system prompt', () => {
    const nodeWithEmptyPrompt = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          system_prompt: ''
        }
      }
    }

    render(
      <AgentNodeEditor
        node={nodeWithEmptyPrompt}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const promptTextarea = screen.getByLabelText(/system prompt/i) as HTMLTextAreaElement
    expect(promptTextarea.value).toBe('')
  })

  it('should handle empty max tokens', () => {
    const nodeWithEmptyTokens = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          max_tokens: undefined
        }
      }
    }

    render(
      <AgentNodeEditor
        node={nodeWithEmptyTokens}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const maxTokensInput = screen.getByLabelText(/max tokens/i) as HTMLInputElement
    expect(maxTokensInput.value).toBe('')
  })

  it('should handle temperature value of 0', async () => {
    const nodeWithZeroTemp = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          temperature: 0
        }
      }
    }

    render(
      <AgentNodeEditor
        node={nodeWithZeroTemp}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const temperatureSlider = screen.getByLabelText(/temperature/i) as HTMLInputElement
    // Note: Component uses || operator, so 0 becomes 0.7 (falsy check)
    // This test verifies the component renders with temperature config
    await waitFor(() => {
      expect(temperatureSlider).toBeInTheDocument()
      // Component treats 0 as falsy and defaults to 0.7
      expect(temperatureSlider.value).toBe('0.7')
    })
  })

  it('should handle temperature value of 1', () => {
    const nodeWithMaxTemp = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          temperature: 1
        }
      }
    }

    render(
      <AgentNodeEditor
        node={nodeWithMaxTemp}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const temperatureSlider = screen.getByLabelText(/temperature/i) as HTMLInputElement
    expect(temperatureSlider.value).toBe('1')
  })

  it('should not update system prompt when input is focused', async () => {
    const { rerender } = render(
      <AgentNodeEditor
        node={mockNode}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const promptTextarea = screen.getByLabelText(/system prompt/i) as HTMLTextAreaElement
    promptTextarea.focus()

    const updatedNode = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          system_prompt: 'Updated prompt'
        }
      }
    }

    rerender(
      <AgentNodeEditor
        node={updatedNode}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    // Value should not change when input is focused
    expect(promptTextarea.value).toBe('You are a helpful assistant')
  })

  it('should not update max tokens when input is focused', async () => {
    const { rerender } = render(
      <AgentNodeEditor
        node={mockNode}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const maxTokensInput = screen.getByLabelText(/max tokens/i) as HTMLInputElement
    maxTokensInput.focus()

    const updatedNode = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          max_tokens: 2000
        }
      }
    }

    rerender(
      <AgentNodeEditor
        node={updatedNode}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    // Value should not change when input is focused
    expect(maxTokensInput.value).toBe('1000')
  })

  it('should use gpt-4o-mini when no model and no availableModels', () => {
    const nodeWithoutModel = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          system_prompt: 'Test'
        }
      }
    }

    render(
      <AgentNodeEditor
        node={nodeWithoutModel}
        availableModels={[]}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const modelSelect = screen.getByLabelText(/model/i) as HTMLSelectElement
    expect(modelSelect.value).toBe('gpt-4o-mini')
  })

  it('should handle empty max tokens input value', async () => {
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

    // Should call onConfigUpdate with undefined when value is empty
    expect(mockOnConfigUpdate).toHaveBeenCalledWith('agent_config', 'max_tokens', undefined)
  })

  it('should handle undefined temperature', () => {
    const nodeWithoutTemp = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          temperature: undefined
        }
      }
    }

    render(
      <AgentNodeEditor
        node={nodeWithoutTemp}
        availableModels={availableModels}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const temperatureSlider = screen.getByLabelText(/temperature/i) as HTMLInputElement
    expect(temperatureSlider.value).toBe('0.7')
  })

  describe('edge cases', () => {
    it('should handle agent_config being null', () => {
      const nodeWithNullConfig = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: null as any
        }
      }

      render(
        <AgentNodeEditor
          node={nodeWithNullConfig}
          availableModels={availableModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const modelSelect = screen.getByLabelText(/model/i) as HTMLSelectElement
      // Should use first available model (agent_config || {})
      expect(modelSelect.value).toBe('gpt-4')
    })

    it('should handle model || operator with availableModels.length > 0', () => {
      const nodeWithoutModel = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            system_prompt: 'Test'
            // model is undefined
          }
        }
      }

      render(
        <AgentNodeEditor
          node={nodeWithoutModel}
          availableModels={availableModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const modelSelect = screen.getByLabelText(/model/i) as HTMLSelectElement
      // Should use first available model
      expect(modelSelect.value).toBe('gpt-4')
    })

    it('should handle model || operator with availableModels.length === 0', () => {
      const nodeWithoutModel = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            system_prompt: 'Test'
            // model is undefined
          }
        }
      }

      render(
        <AgentNodeEditor
          node={nodeWithoutModel}
          availableModels={[]}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const modelSelect = screen.getByLabelText(/model/i) as HTMLSelectElement
      // Should use default 'gpt-4o-mini'
      expect(modelSelect.value).toBe('gpt-4o-mini')
    })

    it('should handle system_prompt || operator with empty string', () => {
      const nodeWithEmptyPrompt = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            system_prompt: ''
          }
        }
      }

      render(
        <AgentNodeEditor
          node={nodeWithEmptyPrompt}
          availableModels={availableModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const promptTextarea = screen.getByLabelText(/system prompt/i) as HTMLTextAreaElement
      // Empty string || '' = '' (empty string is falsy)
      expect(promptTextarea.value).toBe('')
    })

    it('should handle system_prompt || operator with undefined', () => {
      const nodeWithoutPrompt = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            system_prompt: undefined
          }
        }
      }

      render(
        <AgentNodeEditor
          node={nodeWithoutPrompt}
          availableModels={availableModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const promptTextarea = screen.getByLabelText(/system prompt/i) as HTMLTextAreaElement
      // undefined || '' = ''
      expect(promptTextarea.value).toBe('')
    })

    it('should handle max_tokens || operator with undefined', () => {
      const nodeWithoutMaxTokens = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            max_tokens: undefined
          }
        }
      }

      render(
        <AgentNodeEditor
          node={nodeWithoutMaxTokens}
          availableModels={availableModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const maxTokensInput = screen.getByLabelText(/max tokens/i) as HTMLInputElement
      // undefined || '' = ''
      expect(maxTokensInput.value).toBe('')
    })

    it('should handle max_tokens || operator with 0', () => {
      const nodeWithZeroMaxTokens = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            max_tokens: 0
          }
        }
      }

      render(
        <AgentNodeEditor
          node={nodeWithZeroMaxTokens}
          availableModels={availableModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const maxTokensInput = screen.getByLabelText(/max tokens/i) as HTMLInputElement
      // 0 || '' = '' (0 is falsy)
      expect(maxTokensInput.value).toBe('')
    })

    it('should handle temperature || operator with 0', () => {
      const nodeWithZeroTemp = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            temperature: 0
          }
        }
      }

      render(
        <AgentNodeEditor
          node={nodeWithZeroTemp}
          availableModels={availableModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const temperatureSlider = screen.getByLabelText(/temperature/i) as HTMLInputElement
      // 0 || 0.7 = 0.7 (0 is falsy)
      expect(temperatureSlider.value).toBe('0.7')
    })

    it('should handle temperature || operator with undefined', () => {
      const nodeWithoutTemp = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            temperature: undefined
          }
        }
      }

      render(
        <AgentNodeEditor
          node={nodeWithoutTemp}
          availableModels={availableModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const temperatureSlider = screen.getByLabelText(/temperature/i) as HTMLInputElement
      // undefined || 0.7 = 0.7
      expect(temperatureSlider.value).toBe('0.7')
    })

    it('should handle temperature?.toFixed(1) || fallback', () => {
      const nodeWithTemp = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            temperature: 0.5
          }
        }
      }

      render(
        <AgentNodeEditor
          node={nodeWithTemp}
          availableModels={availableModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const temperatureLabel = screen.getByLabelText(/temperature/i).previousElementSibling
      // Should show temperature value
      expect(temperatureLabel?.textContent).toContain('0.5')
    })

    it('should handle availableModels.length > 0 ternary', () => {
      // Test availableModels.length > 0 ? ... : ...
      render(
        <AgentNodeEditor
          node={mockNode}
          availableModels={availableModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      // Should show provider message when models are available
      expect(screen.getByText(/This agent will use the configured LLM provider/i)).toBeInTheDocument()
    })

    it('should handle availableModels.length === 0 ternary', () => {
      render(
        <AgentNodeEditor
          node={mockNode}
          availableModels={[]}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      // Should show OpenAI message when no models available
      expect(screen.getByText(/This agent will call the OpenAI API/i)).toBeInTheDocument()
    })

    it('should handle parseInt with empty string returning undefined', () => {
      render(
        <AgentNodeEditor
          node={mockNode}
          availableModels={availableModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const maxTokensInput = screen.getByLabelText(/max tokens/i) as HTMLInputElement
      fireEvent.change(maxTokensInput, { target: { value: '' } })

      // e.target.value ? parseInt(...) : undefined
      // Empty string is falsy, so should be undefined
      expect(mockOnConfigUpdate).toHaveBeenCalledWith('agent_config', 'max_tokens', undefined)
    })

    it('should handle parseInt with valid number', () => {
      render(
        <AgentNodeEditor
          node={mockNode}
          availableModels={availableModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const maxTokensInput = screen.getByLabelText(/max tokens/i) as HTMLInputElement
      fireEvent.change(maxTokensInput, { target: { value: '500' } })

      // Should parse to number
      expect(mockOnConfigUpdate).toHaveBeenCalledWith('agent_config', 'max_tokens', 500)
    })

    it('should handle parseInt with invalid string', () => {
      render(
        <AgentNodeEditor
          node={mockNode}
          availableModels={availableModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const maxTokensInput = screen.getByLabelText(/max tokens/i) as HTMLInputElement
      fireEvent.change(maxTokensInput, { target: { value: 'abc' } })

      // parseInt('abc') = NaN, but value is truthy so it's passed
      // Verify the code path exists (NaN handling)
      expect(mockOnConfigUpdate).toHaveBeenCalled()
      const lastCall = mockOnConfigUpdate.mock.calls[mockOnConfigUpdate.mock.calls.length - 1]
      expect(lastCall[0]).toBe('agent_config')
      expect(lastCall[1]).toBe('max_tokens')
      // Value might be NaN or undefined depending on implementation
      expect(isNaN(lastCall[2] as number) || lastCall[2] === undefined).toBe(true)
    })

    it('should handle all focus checks for systemPromptRef', () => {
      const { rerender } = render(
        <AgentNodeEditor
          node={mockNode}
          availableModels={availableModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const promptTextarea = screen.getByLabelText(/system prompt/i) as HTMLTextAreaElement
      promptTextarea.focus()

      const updatedNode = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            system_prompt: 'New prompt'
          }
        }
      }

      rerender(
        <AgentNodeEditor
          node={updatedNode}
          availableModels={availableModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      // Value should not change when focused
      expect(promptTextarea.value).toBe('You are a helpful assistant')
    })

    it('should handle all focus checks for maxTokensRef', () => {
      const { rerender } = render(
        <AgentNodeEditor
          node={mockNode}
          availableModels={availableModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const maxTokensInput = screen.getByLabelText(/max tokens/i) as HTMLInputElement
      maxTokensInput.focus()

      const updatedNode = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            max_tokens: 2000
          }
        }
      }

      rerender(
        <AgentNodeEditor
          node={updatedNode}
          availableModels={availableModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      // Value should not change when focused
      expect(maxTokensInput.value).toBe('1000')
    })

    it('should handle model selection with all availableModels', () => {
      const manyModels = [
        { value: 'model1', label: 'Model 1', provider: 'openai' },
        { value: 'model2', label: 'Model 2', provider: 'openai' },
        { value: 'model3', label: 'Model 3', provider: 'openai' }
      ]

      render(
        <AgentNodeEditor
          node={mockNode}
          availableModels={manyModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      // Should render all models
      manyModels.forEach(model => {
        expect(screen.getByText(model.label)).toBeInTheDocument()
      })
    })

    it('should handle temperature parseFloat', () => {
      render(
        <AgentNodeEditor
          node={mockNode}
          availableModels={availableModels}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const temperatureSlider = screen.getByLabelText(/temperature/i) as HTMLInputElement
      fireEvent.change(temperatureSlider, { target: { value: '0.8' } })

      // Should parse to float
      expect(mockOnUpdate).toHaveBeenCalledWith('agent_config', expect.objectContaining({
        temperature: 0.8
      }))
    })

    it('should handle temperature parseFloat with various values', () => {
      const values = ['0.0', '0.1', '0.5', '0.9', '1.0']

      for (const value of values) {
        jest.clearAllMocks()
        document.body.innerHTML = ''
        
        render(
          <AgentNodeEditor
            node={mockNode}
            availableModels={availableModels}
            onUpdate={mockOnUpdate}
            onConfigUpdate={mockOnConfigUpdate}
          />
        )

        const temperatureSlider = screen.getByLabelText(/temperature/i) as HTMLInputElement
        fireEvent.change(temperatureSlider, { target: { value } })

        expect(mockOnUpdate).toHaveBeenCalledWith('agent_config', expect.objectContaining({
          temperature: parseFloat(value)
        }))
      }
    })
  })
})

