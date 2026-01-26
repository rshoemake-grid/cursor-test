import React from 'react'
import { render, screen } from '@testing-library/react'
import ConditionNode from './ConditionNode'
import { ReactFlowProvider } from '@xyflow/react'

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ReactFlowProvider>
      {component}
    </ReactFlowProvider>
  )
}

describe('ConditionNode', () => {
  it('should render condition node', () => {
    renderWithProvider(<ConditionNode selected={false} data={{ label: 'Test Condition' }} id="condition-1" />)

    expect(screen.getByText('Test Condition')).toBeInTheDocument()
  })

  it('should show selected state', () => {
    const { container } = renderWithProvider(<ConditionNode selected={true} data={{ label: 'Test' }} id="condition-1" />)

    const node = container.querySelector('.border-primary-500')
    expect(node).toBeInTheDocument()
  })

  it('should show error state when executionStatus is failed', () => {
    const { container } = renderWithProvider(
      <ConditionNode 
        selected={false} 
        data={{ label: 'Test', executionStatus: 'failed' }} 
        id="condition-1" 
      />
    )

    const node = container.querySelector('.border-red-500')
    expect(node).toBeInTheDocument()
  })

  it('should display description when provided', () => {
    renderWithProvider(
      <ConditionNode 
        selected={false} 
        data={{ label: 'Test', description: 'Test description' }} 
        id="condition-1" 
      />
    )

    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('should display condition config when provided', () => {
    renderWithProvider(
      <ConditionNode 
        selected={false} 
        data={{ 
          label: 'Test', 
          condition_config: { condition_type: 'equals', field: 'status' }
        }} 
        id="condition-1" 
      />
    )

    expect(screen.getByText(/equals: status/)).toBeInTheDocument()
  })

  it('should display True and False handles', () => {
    renderWithProvider(<ConditionNode selected={false} data={{ label: 'Test' }} id="condition-1" />)

    expect(screen.getByText('True')).toBeInTheDocument()
    expect(screen.getByText('False')).toBeInTheDocument()
  })
})
