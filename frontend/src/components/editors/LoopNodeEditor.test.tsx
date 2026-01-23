import { describe, it, expect, vi, beforeEach } from 'vitest'
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
  const mockOnUpdate = vi.fn()
  const mockOnConfigUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
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
})

