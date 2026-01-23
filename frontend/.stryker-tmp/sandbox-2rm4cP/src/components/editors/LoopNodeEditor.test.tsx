// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})

