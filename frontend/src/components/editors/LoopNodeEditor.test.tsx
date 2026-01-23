// Jest globals - no import needed
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoopNodeEditor from './LoopNodeEditor'
import { type NodeWithData } from '../../types/nodeData'

const mockNode: NodeWithData & { type: 'loop' } = {
  id: 'test-loop',
  type: 'loop',
  data: {
    name: 'Test Loop',
    loop_config: {
      loop_type: 'for_each',
      max_iterations: 10,
    },
  },
  position: { x: 0, y: 0 },
} as NodeWithData & { type: 'loop' }

describe('LoopNodeEditor', () => {
  const mockOnUpdate = jest.fn()
  const mockOnConfigUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render loop configuration fields', () => {
    render(
      <LoopNodeEditor
        node={mockNode}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    expect(screen.getByLabelText(/loop type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/max iterations/i)).toBeInTheDocument()
  })

  it('should display current loop type', () => {
    render(
      <LoopNodeEditor
        node={mockNode}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const loopTypeSelect = screen.getByLabelText(/loop type/i) as HTMLSelectElement
    expect(loopTypeSelect.value).toBe('for_each')
  })

  it('should display current max iterations value', () => {
    render(
      <LoopNodeEditor
        node={mockNode}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const maxIterationsInput = screen.getByLabelText(/max iterations/i) as HTMLInputElement
    expect(maxIterationsInput.value).toBe('10')
  })

  it('should call onUpdate when loop type changes', async () => {
    const user = userEvent.setup()
    render(
      <LoopNodeEditor
        node={mockNode}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const loopTypeSelect = screen.getByLabelText(/loop type/i)
    await user.selectOptions(loopTypeSelect, 'while')

    expect(mockOnUpdate).toHaveBeenCalledWith('loop_config', expect.objectContaining({
      loop_type: 'while',
    }))
  })

  it('should call onConfigUpdate when max iterations changes', async () => {
    const user = userEvent.setup()
    render(
      <LoopNodeEditor
        node={mockNode}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const maxIterationsInput = screen.getByLabelText(/max iterations/i)
    await user.clear(maxIterationsInput)
    await user.type(maxIterationsInput, '20')

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('loop_config', 'max_iterations', 20)
  })

  it('should handle zero max iterations', async () => {
    const user = userEvent.setup()
    render(
      <LoopNodeEditor
        node={mockNode}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const maxIterationsInput = screen.getByLabelText(/max iterations/i)
    await user.clear(maxIterationsInput)
    await user.type(maxIterationsInput, '0')

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('loop_config', 'max_iterations', 0)
  })

  it('should display help text for max iterations', () => {
    render(
      <LoopNodeEditor
        node={mockNode}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    expect(screen.getByText(/Maximum number of times/i)).toBeInTheDocument()
  })

  it('should not update max iterations when input is focused', async () => {
    const { rerender } = render(
      <LoopNodeEditor
        node={mockNode}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const maxIterationsInput = screen.getByLabelText(/max iterations/i) as HTMLInputElement
    maxIterationsInput.focus()

    const updatedNode = {
      ...mockNode,
      data: {
        ...mockNode.data,
        loop_config: {
          ...mockNode.data.loop_config,
          max_iterations: 20
        }
      }
    }

    rerender(
      <LoopNodeEditor
        node={updatedNode}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    // Value should not change when input is focused
    expect(maxIterationsInput.value).toBe('10')
  })

  it('should handle undefined max_iterations', () => {
    const nodeWithoutMaxIterations = {
      ...mockNode,
      data: {
        ...mockNode.data,
        loop_config: {
          loop_type: 'for_each'
          // max_iterations is undefined
        }
      }
    }

    render(
      <LoopNodeEditor
        node={nodeWithoutMaxIterations}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const maxIterationsInput = screen.getByLabelText(/max iterations/i) as HTMLInputElement
    expect(maxIterationsInput.value).toBe('0')
  })

  it('should handle empty max iterations input', () => {
    render(
      <LoopNodeEditor
        node={mockNode}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const maxIterationsInput = screen.getByLabelText(/max iterations/i) as HTMLInputElement
    // Simulate empty input
    fireEvent.change(maxIterationsInput, { target: { value: '' } })

    // Should handle empty input and default to 0
    expect(mockOnConfigUpdate).toHaveBeenCalledWith('loop_config', 'max_iterations', 0)
  })

  it('should handle invalid max iterations input', () => {
    render(
      <LoopNodeEditor
        node={mockNode}
        onUpdate={mockOnUpdate}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const maxIterationsInput = screen.getByLabelText(/max iterations/i) as HTMLInputElement
    // Type something that parseInt can't parse properly
    fireEvent.change(maxIterationsInput, { target: { value: 'abc' } })

    // Should default to 0 when parseInt fails
    expect(mockOnConfigUpdate).toHaveBeenCalledWith('loop_config', 'max_iterations', 0)
  })

  describe('edge cases', () => {
    it('should handle loop_config being undefined', () => {
      const nodeWithoutConfig = {
        ...mockNode,
        data: {
          ...mockNode.data,
          loop_config: undefined as any
        }
      }

      render(
        <LoopNodeEditor
          node={nodeWithoutConfig}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const loopTypeSelect = screen.getByLabelText(/loop type/i) as HTMLSelectElement
      // Should use default 'for_each'
      expect(loopTypeSelect.value).toBe('for_each')
    })

    it('should handle loop_config being null', () => {
      const nodeWithNullConfig = {
        ...mockNode,
        data: {
          ...mockNode.data,
          loop_config: null as any
        }
      }

      render(
        <LoopNodeEditor
          node={nodeWithNullConfig}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const loopTypeSelect = screen.getByLabelText(/loop type/i) as HTMLSelectElement
      // Should use default 'for_each'
      expect(loopTypeSelect.value).toBe('for_each')
    })

    it('should handle loop_type being undefined', () => {
      const nodeWithoutType = {
        ...mockNode,
        data: {
          ...mockNode.data,
          loop_config: {
            max_iterations: 10
            // loop_type is undefined
          }
        }
      }

      render(
        <LoopNodeEditor
          node={nodeWithoutType}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const loopTypeSelect = screen.getByLabelText(/loop type/i) as HTMLSelectElement
      // Should use default 'for_each'
      expect(loopTypeSelect.value).toBe('for_each')
    })

    it('should handle max_iterations ?? operator with null', () => {
      const nodeWithNullMaxIterations = {
        ...mockNode,
        data: {
          ...mockNode.data,
          loop_config: {
            loop_type: 'for_each',
            max_iterations: null as any
          }
        }
      }

      render(
        <LoopNodeEditor
          node={nodeWithNullMaxIterations}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const maxIterationsInput = screen.getByLabelText(/max iterations/i) as HTMLInputElement
      // null ?? 0 = 0
      expect(maxIterationsInput.value).toBe('0')
    })

    it('should handle max_iterations ?? operator with undefined', () => {
      const nodeWithoutMaxIterations = {
        ...mockNode,
        data: {
          ...mockNode.data,
          loop_config: {
            loop_type: 'for_each'
            // max_iterations is undefined
          }
        }
      }

      render(
        <LoopNodeEditor
          node={nodeWithoutMaxIterations}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const maxIterationsInput = screen.getByLabelText(/max iterations/i) as HTMLInputElement
      // undefined ?? 0 = 0
      expect(maxIterationsInput.value).toBe('0')
    })

    it('should handle max_iterations ?? operator with 0', () => {
      const nodeWithZeroMaxIterations = {
        ...mockNode,
        data: {
          ...mockNode.data,
          loop_config: {
            loop_type: 'for_each',
            max_iterations: 0
          }
        }
      }

      render(
        <LoopNodeEditor
          node={nodeWithZeroMaxIterations}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const maxIterationsInput = screen.getByLabelText(/max iterations/i) as HTMLInputElement
      // 0 ?? 0 = 0 (0 is not nullish)
      expect(maxIterationsInput.value).toBe('0')
    })

    it('should handle focus check for loopMaxIterationsRef', () => {
      const { rerender } = render(
        <LoopNodeEditor
          node={mockNode}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const maxIterationsInput = screen.getByLabelText(/max iterations/i) as HTMLInputElement
      maxIterationsInput.focus()

      const updatedNode = {
        ...mockNode,
        data: {
          ...mockNode.data,
          loop_config: {
            ...mockNode.data.loop_config,
            max_iterations: 20
          }
        }
      }

      rerender(
        <LoopNodeEditor
          node={updatedNode}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      // Value should not change when focused
      expect(maxIterationsInput.value).toBe('10')
    })

    it('should handle all loop_type values', () => {
      const loopTypes = ['for_each', 'while', 'until']

      for (const loopType of loopTypes) {
        const node = {
          ...mockNode,
          data: {
            ...mockNode.data,
            loop_config: {
              ...mockNode.data.loop_config,
              loop_type: loopType
            }
          }
        }

        const { unmount } = render(
          <LoopNodeEditor
            node={node}
            onUpdate={mockOnUpdate}
            onConfigUpdate={mockOnConfigUpdate}
          />
        )

        const loopTypeSelect = screen.getByLabelText(/loop type/i) as HTMLSelectElement
        expect(loopTypeSelect.value).toBe(loopType)

        unmount()
        // Clean up DOM between renders
        document.body.innerHTML = ''
      }
    })

    it('should handle parseInt || 0 with empty string', () => {
      render(
        <LoopNodeEditor
          node={mockNode}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const maxIterationsInput = screen.getByLabelText(/max iterations/i) as HTMLInputElement
      fireEvent.change(maxIterationsInput, { target: { value: '' } })

      // parseInt('') || 0 = NaN || 0 = 0
      expect(mockOnConfigUpdate).toHaveBeenCalledWith('loop_config', 'max_iterations', 0)
    })

    it('should handle parseInt || 0 with non-numeric string', () => {
      render(
        <LoopNodeEditor
          node={mockNode}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const maxIterationsInput = screen.getByLabelText(/max iterations/i) as HTMLInputElement
      fireEvent.change(maxIterationsInput, { target: { value: 'abc' } })

      // parseInt('abc') || 0 = NaN || 0 = 0
      expect(mockOnConfigUpdate).toHaveBeenCalledWith('loop_config', 'max_iterations', 0)
    })

    it('should handle parseInt || 0 with valid number', () => {
      render(
        <LoopNodeEditor
          node={mockNode}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const maxIterationsInput = screen.getByLabelText(/max iterations/i) as HTMLInputElement
      fireEvent.change(maxIterationsInput, { target: { value: '25' } })

      // parseInt('25') || 0 = 25 || 0 = 25
      expect(mockOnConfigUpdate).toHaveBeenCalledWith('loop_config', 'max_iterations', 25)
    })

    it('should handle onChange with all loop_config fields', () => {
      render(
        <LoopNodeEditor
          node={mockNode}
          onUpdate={mockOnUpdate}
          onConfigUpdate={mockOnConfigUpdate}
        />
      )

      const loopTypeSelect = screen.getByLabelText(/loop type/i)
      fireEvent.change(loopTypeSelect, { target: { value: 'while' } })

      // Should preserve all fields
      expect(mockOnUpdate).toHaveBeenCalledWith('loop_config', expect.objectContaining({
        loop_type: 'while',
        max_iterations: expect.anything()
      }))
    })
  })
})

