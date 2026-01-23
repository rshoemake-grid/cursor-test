// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConditionNodeEditor from './ConditionNodeEditor'
import { type NodeWithData } from '../../types/nodeData'

const mockNode: NodeWithData & { type: 'condition' } = {
  id: 'test-condition',
  type: 'condition',
  data: {
    name: 'Test Condition',
    condition_config: {
      condition_type: 'equals',
      field: 'status',
      value: 'active',
    },
  },
  position: { x: 0, y: 0 },
} as NodeWithData & { type: 'condition' }

describe('ConditionNodeEditor', () => {
  const mockOnConfigUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render condition configuration fields', () => {
    render(
      <ConditionNodeEditor
        node={mockNode}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    expect(screen.getByLabelText(/condition type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^field$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^value$/i)).toBeInTheDocument()
  })

  it('should display current condition type', () => {
    render(
      <ConditionNodeEditor
        node={mockNode}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const conditionTypeSelect = screen.getByLabelText(/condition type/i) as HTMLSelectElement
    expect(conditionTypeSelect.value).toBe('equals')
  })

  it('should call onConfigUpdate when condition type changes', async () => {
    const user = userEvent.setup()
    render(
      <ConditionNodeEditor
        node={mockNode}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const conditionTypeSelect = screen.getByLabelText(/condition type/i)
    await user.selectOptions(conditionTypeSelect, 'not_equals')

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('condition_config', 'condition_type', 'not_equals')
  })

  it('should call onConfigUpdate when field changes', async () => {
    const user = userEvent.setup()
    render(
      <ConditionNodeEditor
        node={mockNode}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const fieldInput = screen.getByLabelText(/^field$/i)
    await user.clear(fieldInput)
    await user.type(fieldInput, 'newField')

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('condition_config', 'field', 'newField')
  })

  it('should call onConfigUpdate when value changes', async () => {
    const user = userEvent.setup()
    render(
      <ConditionNodeEditor
        node={mockNode}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    const valueInput = screen.getByLabelText(/value/i)
    await user.clear(valueInput)
    await user.type(valueInput, 'newValue')

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('condition_config', 'value', 'newValue')
  })

  it('should hide value field for empty/not_empty conditions', () => {
    const nodeWithoutValue: NodeWithData & { type: 'condition' } = {
      ...mockNode,
      data: {
        ...mockNode.data,
        condition_config: {
          condition_type: 'empty',
          field: 'status',
        },
      },
    }

    render(
      <ConditionNodeEditor
        node={nodeWithoutValue}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    expect(screen.queryByLabelText(/value/i)).not.toBeInTheDocument()
  })

  it('should show value field for other condition types', () => {
    render(
      <ConditionNodeEditor
        node={mockNode}
        onConfigUpdate={mockOnConfigUpdate}
      />
    )

    expect(screen.getByLabelText(/value/i)).toBeInTheDocument()
  })
})

